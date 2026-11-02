/*
=====================================================================
EXECUTION OS — 10_Config.js
=====================================================================
Layer:       Foundation (10-19), per 00_File_Map.js
Owns:        Configuration values only — Spreadsheet ID, which AI
              Adapter is active (ADR-015), and the Telegram bot
              token slot (ADR-016). Nothing else.
Built:       2026-09-14, second real runtime file, per this specific
              authorization (10_Config.js only — 11_Schema.js and
              everything after it is explicitly out of scope this
              checkpoint).

Explicitly NOT in this file, per the authorization's own boundary:
  entity schema, persistence logic, a validation engine, AI
  infrastructure, or business logic of any kind. This file only
  reads configuration values; it never opens a Spreadsheet, never
  calls an external API, and holds no secret as a literal in source
  — every deployment-specific value comes from PropertiesService.

Depends on:  60_Observability.js (AlertService, for UCR3).
Called by:   every later Foundation/Runtime/Intelligence file that
              needs the Spreadsheet ID, the active AI Adapter, or
              (once it exists) the bot token.
Writes a Sheet?        No.
Must use TruthEngine?  No — not a Sheet-write concern.
Must use AlertService? Yes — every public function below.

No setters are exposed. Nothing in the reconciled architecture
evidence describes how these properties get set (that's a one-time
deployment/ops concern, likely done directly in the Apps Script
project's Script Properties UI, not something the running
application does to itself) — and ADR-015's adapter migration
hasn't been triggered yet, so a migration-switch function would be
built ahead of any real need. Adding either now would be exactly the
premature engineering this project's own principles rule out.

UCR1 (IIFE) and UCR2 (private functions prefixed `_`) applied
throughout, matching 60_Observability.js.
=====================================================================
*/

const Config = (function() {

  const MODULE = 'Config';

  // Script Properties keys. Namespaced (EXEC_OS_ prefix) so this
  // project's properties can't collide with anything else that
  // might share the same Apps Script project in the future.
  const PROPERTY_KEYS = Object.freeze({
    SPREADSHEET_ID: 'EXEC_OS_SPREADSHEET_ID',
    ACTIVE_AI_ADAPTER: 'EXEC_OS_ACTIVE_AI_ADAPTER',
    TELEGRAM_BOT_TOKEN: 'EXEC_OS_TELEGRAM_BOT_TOKEN'
  });

  // The only two adapter values ADR-015 defines. PERSONAL_AI_CORE
  // is the target state and is not usable yet (Personal AI Core's
  // Gateway is confirmed absent) — it's listed here because it's
  // part of the real, Accepted contract, not because it can be
  // selected today.
  const AI_ADAPTERS = Object.freeze({
    DIRECT_LLM: 'DIRECT_LLM',
    PERSONAL_AI_CORE: 'PERSONAL_AI_CORE'
  });

  // Per ADR-015's Transitional state: the Direct LLM Adapter is
  // what's actually available today, so it's the default rather
  // than requiring every deployment to set this explicitly.
  const DEFAULT_AI_ADAPTER = AI_ADAPTERS.DIRECT_LLM;

  function _getProperty_(key) {
    return PropertiesService.getScriptProperties().getProperty(key);
  }

  function _isKnownAdapter_(value) {
    return value === AI_ADAPTERS.DIRECT_LLM || value === AI_ADAPTERS.PERSONAL_AI_CORE;
  }

  /**
   * The independent Spreadsheet's ID (ADR-012). Required for
   * essentially everything past this file — there is no sensible
   * default, so a missing value throws rather than silently
   * returning something unusable.
   * @return {string}
   */
  function getSpreadsheetId() {
    try {
      const id = _getProperty_(PROPERTY_KEYS.SPREADSHEET_ID);
      if (!id) {
        throw new Error('Spreadsheet ID is not set (Script Properties key: ' +
            PROPERTY_KEYS.SPREADSHEET_ID + ')');
      }
      return id;
    } catch (e) {
      throw new Error(AlertService.log('ERROR', MODULE, 'getSpreadsheetId', {}, e.message));
    }
  }

  /**
   * Which AI Adapter is currently active (ADR-015). Unlike the
   * Spreadsheet ID, this has a well-defined default, so a missing
   * or unrecognized value falls back rather than throwing — this is
   * expected, ordinary configuration drift, not a fatal error.
   * @return {string} One of AI_ADAPTERS.DIRECT_LLM / PERSONAL_AI_CORE.
   */
  function getActiveAiAdapter() {
    try {
      const value = _getProperty_(PROPERTY_KEYS.ACTIVE_AI_ADAPTER);
      if (!value) {
        return DEFAULT_AI_ADAPTER;
      }
      if (!_isKnownAdapter_(value)) {
        AlertService.log('WARN', MODULE, 'getActiveAiAdapter', { value: value },
            'Unrecognized ' + PROPERTY_KEYS.ACTIVE_AI_ADAPTER + ' value, falling back to default (' +
            DEFAULT_AI_ADAPTER + ')');
        return DEFAULT_AI_ADAPTER;
      }
      return value;
    } catch (e) {
      throw new Error(AlertService.log('ERROR', MODULE, 'getActiveAiAdapter', {}, e.message));
    }
  }

  /**
   * The Telegram bot token (ADR-016), once one exists. No bot has
   * been registered yet — that's out of scope for this and every
   * checkpoint until explicitly authorized — so an unset value is
   * the expected, ordinary state, not an error. Returns null rather
   * than throwing.
   * @return {?string}
   */
  function getTelegramBotToken() {
    try {
      return _getProperty_(PROPERTY_KEYS.TELEGRAM_BOT_TOKEN) || null;
    } catch (e) {
      throw new Error(AlertService.log('ERROR', MODULE, 'getTelegramBotToken', {}, e.message));
    }
  }

  return {
    PROPERTY_KEYS: PROPERTY_KEYS,
    AI_ADAPTERS: AI_ADAPTERS,
    getSpreadsheetId: getSpreadsheetId,
    getActiveAiAdapter: getActiveAiAdapter,
    getTelegramBotToken: getTelegramBotToken
  };

})();
