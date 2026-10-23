/* ===================================================================
   Configurazione pubblica del sito.
   Qui NON va nessun segreto: questo file è servito a tutti i visitatori.
   Le credenziali (registro, Telegram, token GitHub) restano nei GitHub
   Secrets e nelle variabili del Worker Cloudflare.
   =================================================================== */
window.ORARIO_CONFIG = {
  // Dove viene salvato l'elenco compiti aggiornato dal bot.
  // Se il sito è nella stessa repo del bot, va bene il percorso relativo.
  homeworkUrl: "data/homework.json",

  // URL del Worker Cloudflare che avvia il bot (vedi worker/README.md).
  // Lascia vuoto per disabilitare il pulsante "Richiedi compiti".
  requestEndpoint: "",

  // Dopo una richiesta, per quanto tempo attendere prima di riabilitare il pulsante.
  requestCooldownMs: 2 * 60 * 1000,

  // Ogni quanto ricaricare i compiti dal sito (ms).
  refreshIntervalMs: 5 * 60 * 1000,
};
