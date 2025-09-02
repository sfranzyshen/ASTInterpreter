// --- Web Audio API Sound Setup ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let isMuted = false; // Global mute state

function playClickSound() {
    if (isMuted) return; // Do nothing if muted
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // C5 note

    gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.12);
}

// --- Dynamic Script Loader ---
function loadScript(src) {
    return new Promise((resolve, reject) => {
        // Remove any existing script with the same language file pattern to allow reloading
        const oldScript = document.querySelector(`script[src="${src}"]`);
        if (oldScript) {
            oldScript.remove();
        }
        
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
            console.log(`Successfully loaded script: ${src}`);
            resolve();
        };
        script.onerror = () => {
            console.error(`Failed to load script: ${src}`);
            reject(new Error(`Script load error for ${src}`));
        };
        document.head.appendChild(script);
    });
}

// --- Language Data & Mapping ---
// Map our app's language codes to Blockly's file names if they differ
const blocklyLangMap = {
    "zh": "zh-hans", // Map generic Chinese to Simplified Chinese
};

const translations = {
    "en": {
        "nativeName": "English",
        "avoidBtn": "Avoid",
        "ble": "BLE",
        "blocksTab": "Blocks",
        "centerBtnTitle": "Stop",
        "clearConsoleBtnTitle": "Clear Console",
        "confirmDeleteBlocksTitle": "Delete Blocks?",
        "confirmDeleteSketchTitle": "Delete Sketch?",
        "codeTab": "Code",
        "connectivityToggleBtnTitle": "Change Connectivity",
        "controlTab": "Control",
        "downBtnTitle": "Backward",
        "followBtn": "Follow",
        "languageToggleBtnTitle": "Change language",
        "leftBtnTitle": "Turn Left",
        "loadFileBtnTitle": "Load Code from File",
        "muteBtnTitle": "Mute",
        "net": "NET",
        "newFileBtnTitle": "New Sketch",
        "pageTitle": "Ottodiy Ninja",
        "rightBtnTitle": "Turn Right",
        "rollModeBtn": "Roll",
        "runCodeBtnTitle": "Run Code",
        "saveFileBtnTitle": "Save Code to File",
        "ser": "SER",
        "stopCodeBtnTitle": "Stop Code",
        "textOnlyModeLabel": "Text Only Mode",
        "textTab": "Text",
        "themeToggleBtnDark": "Switch to Light Mode",
        "themeToggleBtnLight": "Switch to Dark Mode",
        "toolboxArduino": "Arduino",
        "toolboxForLoopBy": "by",
        "toolboxForLoopDo": "do",
        "toolboxForLoopFor": "for",
        "toolboxForLoopFrom": "from",
        "toolboxForLoopTo": "to",
        "toolboxFunctions": "Functions",
        "toolboxLogic": "Logic",
        "toolboxLoops": "Loops",
        "toolboxMath": "Math",
        "toolboxText": "Text",
        "toolboxVariables": "Variables",
        "unmuteBtnTitle": "Unmute",
        "upBtnTitle": "Forward",
        "variablePromptCancel": "Cancel",
        "variablePromptOk": "OK",
        "variablePromptTitle": "Variable name:",
        "walkModeBtn": "Walk"
    },
    "es": {
        "nativeName": "Español",
        "avoidBtn": "Evitar",
        "ble": "BLE",
        "blocksTab": "Bloques",
        "centerBtnTitle": "Detener",
        "clearConsoleBtnTitle": "Limpiar Consola",
        "confirmDeleteBlocksTitle": "¿Eliminar Bloques?",
        "confirmDeleteSketchTitle": "¿Eliminar Boceto?",
        "codeTab": "Código",
        "connectivityToggleBtnTitle": "Cambiar Conectividad",
        "controlTab": "Control",
        "downBtnTitle": "Atrás",
        "followBtn": "Seguir",
        "languageToggleBtnTitle": "Cambiar idioma",
        "leftBtnTitle": "Girar Izquierda",
        "loadFileBtnTitle": "Cargar Código desde Archivo",
        "muteBtnTitle": "Silenciar",
        "net": "RED",
        "newFileBtnTitle": "Nuevo Boceto",
        "pageTitle": "Ottodiy Ninja",
        "rightBtnTitle": "Girar Derecha",
        "rollModeBtn": "Rodar",
        "runCodeBtnTitle": "Ejecutar Código",
        "saveFileBtnTitle": "Guardar Código en Archivo",
        "ser": "SER",
        "stopCodeBtnTitle": "Detener Código",
        "textOnlyModeLabel": "Modo Solo Texto",
        "textTab": "Texto",
        "themeToggleBtnDark": "Cambiar a Modo Claro",
        "themeToggleBtnLight": "Cambiar a Modo Oscuro",
        "toolboxArduino": "Arduino",
        "toolboxForLoopBy": "en pasos de",
        "toolboxForLoopDo": "hacer",
        "toolboxForLoopFor": "para",
        "toolboxForLoopFrom": "desde",
        "toolboxForLoopTo": "hasta",
        "toolboxFunctions": "Funciones",
        "toolboxLogic": "Lógica",
        "toolboxLoops": "Bucles",
        "toolboxMath": "Matemáticas",
        "toolboxText": "Texto",
        "toolboxVariables": "Variables",
        "unmuteBtnTitle": "Reactivar Sonido",
        "upBtnTitle": "Adelante",
        "variablePromptCancel": "Cancelar",
        "variablePromptOk": "Aceptar",
        "variablePromptTitle": "Nombre de la variable:",
        "walkModeBtn": "Caminar"
    },
    "fr": {
        "nativeName": "Français",
        "avoidBtn": "Éviter",
        "ble": "BLE",
        "blocksTab": "Blocs",
        "centerBtnTitle": "Arrêter",
        "clearConsoleBtnTitle": "Effacer la console",
        "confirmDeleteBlocksTitle": "Supprimer les Blocs ?",
        "confirmDeleteSketchTitle": "Supprimer le Croquis ?",
        "codeTab": "Code",
        "connectivityToggleBtnTitle": "Changer de Connectivité",
        "controlTab": "Contrôle",
        "downBtnTitle": "Reculer",
        "followBtn": "Suivre",
        "languageToggleBtnTitle": "Changer de langue",
        "leftBtnTitle": "Tourner à Gauche",
        "loadFileBtnTitle": "Charger le code depuis un fichier",
        "muteBtnTitle": "Muet",
        "net": "RÉSEAU",
        "newFileBtnTitle": "Nouveau Croquis",
        "pageTitle": "Ottodiy Ninja",
        "rightBtnTitle": "Tourner à Droite",
        "rollModeBtn": "Rouler",
        "runCodeBtnTitle": "Exécuter le code",
        "saveFileBtnTitle": "Sauvegarder le code dans un fichier",
        "ser": "SÉRIE",
        "stopCodeBtnTitle": "Arrêter le code",
        "textOnlyModeLabel": "Mode Texte Seul",
        "textTab": "Texte",
        "themeToggleBtnDark": "Passer au Mode Clair",
        "themeToggleBtnLight": "Passer au Mode Sombre",
        "toolboxArduino": "Arduino",
        "toolboxForLoopBy": "par pas de",
        "toolboxForLoopDo": "faire",
        "toolboxForLoopFor": "pour",
        "toolboxForLoopFrom": "de",
        "toolboxForLoopTo": "à",
        "toolboxFunctions": "Funciones",
        "toolboxLogic": "Logique",
        "toolboxLoops": "Boucles",
        "toolboxMath": "Maths",
        "toolboxText": "Texte",
        "toolboxVariables": "Variables",
        "unmuteBtnTitle": "Activer le son",
        "upBtnTitle": "Avancer",
        "variablePromptCancel": "Annuler",
        "variablePromptOk": "OK",
        "variablePromptTitle": "Nom de la variable :",
        "walkModeBtn": "Marcher"
    },
    "de": {
        "nativeName": "Deutsch",
        "avoidBtn": "Vermeiden",
        "ble": "BLE",
        "blocksTab": "Blöcke",
        "centerBtnTitle": "Stoppen",
        "clearConsoleBtnTitle": "Konsole leeren",
        "confirmDeleteBlocksTitle": "Blöcke löschen?",
        "confirmDeleteSketchTitle": "Sketch löschen?",
        "codeTab": "Code",
        "connectivityToggleBtnTitle": "Konnektivität ändern",
        "controlTab": "Steuerung",
        "downBtnTitle": "Rückwärts",
        "followBtn": "Folgen",
        "languageToggleBtnTitle": "Sprache ändern",
        "leftBtnTitle": "Links Abbiegen",
        "loadFileBtnTitle": "Code aus Datei laden",
        "muteBtnTitle": "Stumm",
        "net": "NETZ",
        "newFileBtnTitle": "Neuer Sketch",
        "pageTitle": "Ottodiy Ninja",
        "rightBtnTitle": "Rechts Abbiegen",
        "rollModeBtn": "Rollen",
        "runCodeBtnTitle": "Code ausführen",
        "saveFileBtnTitle": "Code in Datei speichern",
        "ser": "SERIELL",
        "stopCodeBtnTitle": "Code anhalten",
        "textOnlyModeLabel": "Nur-Text-Modus",
        "textTab": "Text",
        "themeToggleBtnDark": "Zum Hellmodus wechseln",
        "themeToggleBtnLight": "Zum Dunkelmodus wechseln",
        "toolboxArduino": "Arduino",
        "toolboxForLoopBy": "in Schritten von",
        "toolboxForLoopDo": "mache",
        "toolboxForLoopFor": "für",
        "toolboxForLoopFrom": "von",
        "toolboxForLoopTo": "bis",
        "toolboxFunctions": "Funktionen",
        "toolboxLogic": "Logik",
        "toolboxLoops": "Schleifen",
        "toolboxMath": "Mathematik",
        "toolboxText": "Text",
        "toolboxVariables": "Variablen",
        "unmuteBtnTitle": "Ton an",
        "upBtnTitle": "Vorwärts",
        "variablePromptCancel": "Abbrechen",
        "variablePromptOk": "OK",
        "variablePromptTitle": "Variablenname:",
        "walkModeBtn": "Gehen"
    },
    "it": {
        "nativeName": "Italiano",
        "avoidBtn": "Evita",
        "ble": "BLE",
        "blocksTab": "Blocchi",
        "centerBtnTitle": "Stop",
        "clearConsoleBtnTitle": "Pulisci Console",
        "confirmDeleteBlocksTitle": "Eliminare i Blocchi?",
        "confirmDeleteSketchTitle": "Eliminare lo Sketch?",
        "codeTab": "Codice",
        "connectivityToggleBtnTitle": "Cambia Connettività",
        "controlTab": "Controllo",
        "downBtnTitle": "Indietro",
        "followBtn": "Segui",
        "languageToggleBtnTitle": "Cambia lingua",
        "leftBtnTitle": "Gira a Sinistra",
        "loadFileBtnTitle": "Carica Codice da File",
        "muteBtnTitle": "Muto",
        "net": "RETE",
        "newFileBtnTitle": "Nuovo Sketch",
        "pageTitle": "Ottodiy Ninja",
        "rightBtnTitle": "Gira a Destra",
        "rollModeBtn": "Rotola",
        "runCodeBtnTitle": "Esegui Codice",
        "saveFileBtnTitle": "Salva Codice su File",
        "ser": "SERIALE",
        "stopCodeBtnTitle": "Ferma Codice",
        "textOnlyModeLabel": "Modalità Solo Testo",
        "textTab": "Testo",
        "themeToggleBtnDark": "Passa alla Modalità Chiara",
        "themeToggleBtnLight": "Passa alla Modalità Scura",
        "toolboxArduino": "Arduino",
        "toolboxForLoopBy": "di",
        "toolboxForLoopDo": "fai",
        "toolboxForLoopFor": "per",
        "toolboxForLoopFrom": "da",
        "toolboxForLoopTo": "a",
        "toolboxFunctions": "Funzioni",
        "toolboxLogic": "Logica",
        "toolboxLoops": "Cicli",
        "toolboxMath": "Matematica",
        "toolboxText": "Testo",
        "toolboxVariables": "Variabili",
        "unmuteBtnTitle": "Riattiva Audio",
        "upBtnTitle": "Avanti",
        "variablePromptCancel": "Annulla",
        "variablePromptOk": "OK",
        "variablePromptTitle": "Nome variabile:",
        "walkModeBtn": "Cammina"
    },
    "nl": {
        "nativeName": "Nederlands",
        "avoidBtn": "Vermijden",
        "ble": "BLE",
        "blocksTab": "Blokken",
        "centerBtnTitle": "Stop",
        "clearConsoleBtnTitle": "Console Wissen",
        "confirmDeleteBlocksTitle": "Blokken verwijderen?",
        "confirmDeleteSketchTitle": "Schets verwijderen?",
        "codeTab": "Code",
        "connectivityToggleBtnTitle": "Connectiviteit wijzigen",
        "controlTab": "Besturing",
        "downBtnTitle": "Achteruit",
        "followBtn": "Volgen",
        "languageToggleBtnTitle": "Taal wijzigen",
        "leftBtnTitle": "Sla Linksaf",
        "loadFileBtnTitle": "Code uit Bestand Laden",
        "muteBtnTitle": "Dempen",
        "net": "NET",
        "newFileBtnTitle": "Nieuwe Schets",
        "pageTitle": "Ottodiy Ninja",
        "rightBtnTitle": "Sla Rechtsaf",
        "rollModeBtn": "Rollen",
        "runCodeBtnTitle": "Code Uitvoeren",
        "saveFileBtnTitle": "Code in Bestand Opslaan",
        "ser": "SERIEEL",
        "stopCodeBtnTitle": "Code Stoppen",
        "textOnlyModeLabel": "Alleen-tekstmodus",
        "textTab": "Tekst",
        "themeToggleBtnDark": "Schakel naar Lichte Modus",
        "themeToggleBtnLight": "Schakel naar Donkere Modus",
        "toolboxArduino": "Arduino",
        "toolboxForLoopBy": "met",
        "toolboxForLoopDo": "doe",
        "toolboxForLoopFor": "voor",
        "toolboxForLoopFrom": "van",
        "toolboxForLoopTo": "tot",
        "toolboxFunctions": "Functies",
        "toolboxLogic": "Logica",
        "toolboxLoops": "Lussen",
        "toolboxMath": "Wiskunde",
        "toolboxText": "Tekst",
        "toolboxVariables": "Variabelen",
        "unmuteBtnTitle": "Dempen opheffen",
        "upBtnTitle": "Vooruit",
        "variablePromptCancel": "Annuleren",
        "variablePromptOk": "OK",
        "variablePromptTitle": "Variabelenaam:",
        "walkModeBtn": "Lopen"
    },
    "ja": {
        "nativeName": "日本語",
        "avoidBtn": "回避",
        "ble": "BLE",
        "blocksTab": "ブロック",
        "centerBtnTitle": "停止",
        "clearConsoleBtnTitle": "コンソールをクリア",
        "confirmDeleteBlocksTitle": "ブロックを削除しますか？",
        "confirmDeleteSketchTitle": "スケッチを削除しますか？",
        "codeTab": "コード",
        "connectivityToggleBtnTitle": "接続を変更",
        "controlTab": "制御",
        "downBtnTitle": "後退",
        "followBtn": "追跡",
        "languageToggleBtnTitle": "言語を変更",
        "leftBtnTitle": "左折",
        "loadFileBtnTitle": "ファイルからコードを読み込む",
        "muteBtnTitle": "ミュート",
        "net": "ネット",
        "newFileBtnTitle": "新規スケッチ",
        "pageTitle": "Ottodiy ニンジャ",
        "rightBtnTitle": "右折",
        "rollModeBtn": "転がる",
        "runCodeBtnTitle": "コードを実行",
        "saveFileBtnTitle": "ファイルにコードを保存",
        "ser": "シリアル",
        "stopCodeBtnTitle": "コードを停止",
        "textOnlyModeLabel": "テキストのみモード",
        "textTab": "テキスト",
        "themeToggleBtnDark": "ライトモードに切り替え",
        "themeToggleBtnLight": "ダークモードに切り替え",
        "toolboxArduino": "Arduino",
        "toolboxForLoopBy": "ずつ",
        "toolboxForLoopDo": "実行",
        "toolboxForLoopFor": "変数",
        "toolboxForLoopFrom": "から",
        "toolboxForLoopTo": "まで",
        "toolboxFunctions": "関数",
        "toolboxLogic": "論理",
        "toolboxLoops": "繰り返し",
        "toolboxMath": "数学",
        "toolboxText": "テキスト",
        "toolboxVariables": "変数",
        "unmuteBtnTitle": "ミュート解除",
        "upBtnTitle": "前進",
        "variablePromptCancel": "キャンセル",
        "variablePromptOk": "OK",
        "variablePromptTitle": "変数名:",
        "walkModeBtn": "歩く"
    },
    "zh": {
        "nativeName": "中文",
        "avoidBtn": "避開",
        "ble": "蓝牙",
        "blocksTab": "积木",
        "centerBtnTitle": "停止",
        "clearConsoleBtnTitle": "清除控制台",
        "confirmDeleteBlocksTitle": "删除积木？",
        "confirmDeleteSketchTitle": "删除代码？",
        "codeTab": "代码",
        "connectivityToggleBtnTitle": "更改连接",
        "controlTab": "控制",
        "downBtnTitle": "后退",
        "followBtn": "跟隨",
        "languageToggleBtnTitle": "更改语言",
        "leftBtnTitle": "左转",
        "loadFileBtnTitle": "从文件加载代码",
        "muteBtnTitle": "静音",
        "net": "网络",
        "newFileBtnTitle": "新建代码",
        "pageTitle": "Ottodiy 忍者",
        "rightBtnTitle": "右转",
        "rollModeBtn": "滚动",
        "runCodeBtnTitle": "运行代码",
        "saveFileBtnTitle": "保存代码到文件",
        "ser": "串口",
        "stopCodeBtnTitle": "停止代码",
        "textOnlyModeLabel": "纯文本模式",
        "textTab": "文本",
        "themeToggleBtnDark": "切换到浅色模式",
        "themeToggleBtnLight": "切换到深色模式",
        "toolboxArduino": "Arduino",
        "toolboxForLoopBy": "步长",
        "toolboxForLoopDo": "执行",
        "toolboxForLoopFor": "计数",
        "toolboxForLoopFrom": "从",
        "toolboxForLoopTo": "到",
        "toolboxFunctions": "函数",
        "toolboxLogic": "逻辑",
        "toolboxLoops": "循环",
        "toolboxMath": "数学",
        "toolboxText": "文本",
        "toolboxVariables": "变量",
        "unmuteBtnTitle": "取消静音",
        "upBtnTitle": "前进",
        "variablePromptCancel": "取消",
        "variablePromptOk": "确定",
        "variablePromptTitle": "变量名：",
        "walkModeBtn": "步行"
    },
    "sv": {
        "nativeName": "Svenska",
        "avoidBtn": "Undvik",
        "ble": "BLE",
        "blocksTab": "Block",
        "centerBtnTitle": "Stopp",
        "clearConsoleBtnTitle": "Rensa Konsolen",
        "confirmDeleteBlocksTitle": "Ta bort Block?",
        "confirmDeleteSketchTitle": "Ta bort Skiss?",
        "codeTab": "Kod",
        "connectivityToggleBtnTitle": "Ändra Anslutning",
        "controlTab": "Kontroll",
        "downBtnTitle": "Bakåt",
        "followBtn": "Följ",
        "languageToggleBtnTitle": "Ändra språk",
        "leftBtnTitle": "Sväng Vänster",
        "loadFileBtnTitle": "Ladda Kod från Fil",
        "muteBtnTitle": "Tyst",
        "net": "NÄT",
        "newFileBtnTitle": "Ny Skiss",
        "pageTitle": "Ottodiy Ninja",
        "rightBtnTitle": "Sväng Höger",
        "rollModeBtn": "Rulla",
        "runCodeBtnTitle": "Kör Kod",
        "saveFileBtnTitle": "Spara Kod till Fil",
        "ser": "SERIELL",
        "stopCodeBtnTitle": "Stoppa Kod",
        "textOnlyModeLabel": "Endast textläge",
        "textTab": "Text",
        "themeToggleBtnDark": "Växla till Ljust Läge",
        "themeToggleBtnLight": "Växla till Mörkt Läge",
        "toolboxArduino": "Arduino",
        "toolboxForLoopBy": "med",
        "toolboxForLoopDo": "gör",
        "toolboxForLoopFor": "för",
        "toolboxForLoopFrom": "från",
        "toolboxForLoopTo": "till",
        "toolboxFunctions": "Funktioner",
        "toolboxLogic": "Logik",
        "toolboxLoops": "Loopar",
        "toolboxMath": "Matematik",
        "toolboxText": "Text",
        "toolboxVariables": "Variabler",
        "unmuteBtnTitle": "Ljud på",
        "upBtnTitle": "Framåt",
        "variablePromptCancel": "Avbryt",
        "variablePromptOk": "OK",
        "variablePromptTitle": "Variabelnamn:",
        "walkModeBtn": "Gå"
    },
    "pt": {
        "nativeName": "Português",
        "avoidBtn": "Evitar",
        "ble": "BLE",
        "blocksTab": "Blocos",
        "centerBtnTitle": "Parar",
        "clearConsoleBtnTitle": "Limpar Console",
        "confirmDeleteBlocksTitle": "Excluir Blocos?",
        "confirmDeleteSketchTitle": "Excluir Esboço?",
        "codeTab": "Código",
        "connectivityToggleBtnTitle": "Mudar Conectividade",
        "controlTab": "Controle",
        "downBtnTitle": "Para Trás",
        "followBtn": "Seguir",
        "languageToggleBtnTitle": "Mudar idioma",
        "leftBtnTitle": "Virar à Esquerda",
        "loadFileBtnTitle": "Carregar Código do Arquivo",
        "muteBtnTitle": "Mudo",
        "net": "REDE",
        "newFileBtnTitle": "Novo Esboço",
        "pageTitle": "Ottodiy Ninja",
        "rightBtnTitle": "Virar à Direita",
        "rollModeBtn": "Rolar",
        "runCodeBtnTitle": "Executar Código",
        "saveFileBtnTitle": "Salvar Código no Arquivo",
        "ser": "SERIAL",
        "stopCodeBtnTitle": "Parar Código",
        "textOnlyModeLabel": "Modo Apenas Texto",
        "textTab": "Texto",
        "themeToggleBtnDark": "Mudar para Modo Claro",
        "themeToggleBtnLight": "Mudar para Modo Escuro",
        "toolboxArduino": "Arduino",
        "toolboxForLoopBy": "por",
        "toolboxForLoopDo": "faça",
        "toolboxForLoopFor": "para",
        "toolboxForLoopFrom": "de",
        "toolboxForLoopTo": "até",
        "toolboxFunctions": "Funções",
        "toolboxLogic": "Lógica",
        "toolboxLoops": "Laços",
        "toolboxMath": "Matemática",
        "toolboxText": "Texto",
        "toolboxVariables": "Variáveis",
        "unmuteBtnTitle": "Ativar som",
        "upBtnTitle": "Para Frente",
        "variablePromptCancel": "Cancelar",
        "variablePromptOk": "OK",
        "variablePromptTitle": "Nome da variável:",
        "walkModeBtn": "Andar"
    },
    "ru": {
        "nativeName": "Русский",
        "avoidBtn": "Избегать",
        "ble": "BLE",
        "blocksTab": "Блоки",
        "centerBtnTitle": "Стоп",
        "clearConsoleBtnTitle": "Очистить консоль",
        "confirmDeleteBlocksTitle": "Удалить Блоки?",
        "confirmDeleteSketchTitle": "Удалить Скетч?",
        "codeTab": "Код",
        "connectivityToggleBtnTitle": "Изменить Подключение",
        "controlTab": "Управление",
        "downBtnTitle": "Назад",
        "followBtn": "Следовать",
        "languageToggleBtnTitle": "Изменить язык",
        "leftBtnTitle": "Повернуть Влево",
        "loadFileBtnTitle": "Загрузить код из файла",
        "muteBtnTitle": "Без звука",
        "net": "СЕТЬ",
        "newFileBtnTitle": "Новый Скетч",
        "pageTitle": "Ottodiy Ниндзя",
        "rightBtnTitle": "Повернуть Вправо",
        "rollModeBtn": "Катиться",
        "runCodeBtnTitle": "Запустить код",
        "saveFileBtnTitle": "Сохранить код в файл",
        "ser": "СЕРИЙНЫЙ",
        "stopCodeBtnTitle": "Остановить код",
        "textOnlyModeLabel": "Режим «Только текст»",
        "textTab": "Текст",
        "themeToggleBtnDark": "Переключить на Светлый Режим",
        "themeToggleBtnLight": "Переключить на Темный Режим",
        "toolboxArduino": "Arduino",
        "toolboxForLoopBy": "с шагом",
        "toolboxForLoopDo": "выполнить",
        "toolboxForLoopFor": "для",
        "toolboxForLoopFrom": "от",
        "toolboxForLoopTo": "до",
        "toolboxFunctions": "Функции",
        "toolboxLogic": "Логика",
        "toolboxLoops": "Циклы",
        "toolboxMath": "Математика",
        "toolboxText": "Текст",
        "toolboxVariables": "Переменные",
        "unmuteBtnTitle": "Включить звук",
        "upBtnTitle": "Вперед",
        "variablePromptCancel": "Отмена",
        "variablePromptOk": "OK",
        "variablePromptTitle": "Имя переменной:",
        "walkModeBtn": "Идти"
    },
    "pl": {
        "nativeName": "Polski",
        "avoidBtn": "Unikaj",
        "ble": "BLE",
        "blocksTab": "Bloki",
        "centerBtnTitle": "Stop",
        "clearConsoleBtnTitle": "Wyczyść Konsolę",
        "confirmDeleteBlocksTitle": "Usunąć Bloki?",
        "confirmDeleteSketchTitle": "Usunąć Szkic?",
        "codeTab": "Kod",
        "connectivityToggleBtnTitle": "Zmień Łączność",
        "controlTab": "Sterowanie",
        "downBtnTitle": "Do Tyłu",
        "followBtn": "Śledź",
        "languageToggleBtnTitle": "Zmień język",
        "leftBtnTitle": "Skręć W Lewo",
        "loadFileBtnTitle": "Wczytaj Kod z Pliku",
        "muteBtnTitle": "Wycisz",
        "net": "SIEĆ",
        "newFileBtnTitle": "Nowy Szkic",
        "pageTitle": "Ottodiy Ninja",
        "rightBtnTitle": "Skręć W Prawo",
        "rollModeBtn": "Toczyć",
        "runCodeBtnTitle": "Uruchom Kod",
        "saveFileBtnTitle": "Zapisz Kod do Pliku",
        "ser": "SZEREGOWY",
        "stopCodeBtnTitle": "Zatrzymaj Kod",
        "textOnlyModeLabel": "Tryb Tylko Tekst",
        "textTab": "Tekst",
        "themeToggleBtnDark": "Przełącz na Tryb Jasny",
        "themeToggleBtnLight": "Przełącz na Tryb Ciemny",
        "toolboxArduino": "Arduino",
        "toolboxForLoopBy": "co",
        "toolboxForLoopDo": "wykonaj",
        "toolboxForLoopFor": "dla",
        "toolboxForLoopFrom": "od",
        "toolboxForLoopTo": "do",
        "toolboxFunctions": "Funkcje",
        "toolboxLogic": "Logika",
        "toolboxLoops": "Pętle",
        "toolboxMath": "Matematyka",
        "toolboxText": "Tekst",
        "toolboxVariables": "Zmienne",
        "unmuteBtnTitle": "Wyłącz wyciszenie",
        "upBtnTitle": "Do Przodu",
        "variablePromptCancel": "Anuluj",
        "variablePromptOk": "OK",
        "variablePromptTitle": "Nazwa zmiennej:",
        "walkModeBtn": "Chodzić"
    }
};

let currentLanguage = "en"; // Default language
let currentConnectivity = "net"; // Default connectivity mode

// Function to apply translations
function applyTranslations(langCode) {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.dataset.i18n;
        if (translations[langCode] && translations[langCode][key]) {
            // Check if the key is for a 'title' attribute
            if (key.endsWith('Title') || element.id === 'muteToggleBtn') { // Include mute button in title logic
                if (element.id === 'themeToggleBtn') {
                    const isLight = body.classList.contains('light-theme');
                    element.title = isLight ? translations[langCode]['themeToggleBtnLight'] : translations[langCode]['themeToggleBtnDark'];
                } else if (element.id === 'muteToggleBtn') {
                    element.title = isMuted ? translations[langCode]['unmuteBtnTitle'] : translations[langCode]['muteBtnTitle'];
                }
                 else {
                    element.title = translations[langCode][key];
                }
            }
            // Handle elements that should have their textContent changed
            else if (element.tagName === 'BUTTON' || element.tagName === 'H1' || element.tagName === 'TITLE' || element.tagName === 'P' || element.tagName === 'LABEL') {
                // Skip language/connectivity buttons with special content
                if (element.dataset.lang || element.dataset.conn) {
                    // Do nothing, their content is handled separately
                }
                // Skip header icons that only contain SVG
                else if (element.id === 'themeToggleBtn' || element.id === 'languageToggleBtn' || element.id === 'connectivityToggleBtn' || element.id === 'muteToggleBtn') {
                    // Do nothing
                }
                // For all other text-based buttons and titles
                else {
                    element.textContent = translations[langCode][key];
                }
            }
        }
    });

    // Update the document title separately
    document.title = translations[langCode]["pageTitle"];
    currentLanguage = langCode; // Update the global current language
}

// **NEW** Function to translate Blockly toolbox categories
function translateBlocklyToolbox(langCode) {
    const toolboxXml = document.getElementById('toolbox');
    if (!toolboxXml) return;

    const categories = toolboxXml.getElementsByTagName('category');
    for (let i = 0; i < categories.length; i++) {
        const category = categories[i];
        const key = category.getAttribute('i18n-key');
        if (key && translations[langCode] && translations[langCode][key]) {
            category.setAttribute('name', translations[langCode][key]);
        }
    }
}


// --- Get Panel Elements ---
const buttonPanel = document.getElementById('buttonPanel');
const joystickPanel = document.getElementById('joystickPanel');
const mainContentArea = document.getElementById('mainContentArea'); // Main control content area
const codeContentArea = document.getElementById('codeContentArea'); // New: Code content area

// --- Directional Button Logic ---
const directionalButtons = document.querySelectorAll('.button-panel button');
let activeButton = null; // To keep track of the currently active (latched) arrow button

directionalButtons.forEach(button => {
    button.addEventListener('click', () => {
        playClickSound(); // Play sound on button click

        const isArrowButton = button.id === 'upBtn' ||
                              button.id === 'leftBtn' ||
                              button.id === 'rightBtn' ||
                              button.id === 'downBtn';

        if (activeButton) {
            activeButton.classList.remove('active-button');
        }

        if (isArrowButton) {
            button.classList.add('active-button');
            activeButton = button;
            console.log(`${button.id} clicked and is now latched.`);
        } else if (button.id === 'centerBtn') {
            activeButton = null; // No arrow button is latched
            console.log(`Center button clicked (momentary).`);
        }
    });
});

// --- Walk/Roll Switch Logic ---
const walkModeBtn = document.getElementById('walkModeBtn');
const rollModeBtn = document.getElementById('rollModeBtn');
let currentMode = 'walk'; // Default mode

// Function to set the active mode and toggle panel visibility
function setMode(mode) {
    playClickSound(); // Play sound on mode switch

    // Remove active class from both mode buttons
    walkModeBtn.classList.remove('active-mode');
    rollModeBtn.classList.remove('active-mode');

    // Toggle active class on mode buttons and switch panels
    if (mode === 'walk') {
        walkModeBtn.classList.add('active-mode');
        // buttonPanel.style.display = 'grid'; // Removed: Now set in CSS
        buttonPanel.style.display = ''; // Reset to default (which is grid from CSS)
        joystickPanel.style.display = 'none'; // Hide joystick panel
        currentMode = 'walk';
        // Clear any latched directional button when switching away from joystick
        if (activeButton) {
            activeButton.classList.remove('active-button');
            activeButton = null;
        }
    } else if (mode === 'roll') {
        rollModeBtn.classList.add('active-mode');
        buttonPanel.style.display = 'none'; // Hide button panel
        joystickPanel.style.display = 'flex'; // Show joystick panel
        currentMode = 'roll';
        // Clear any latched directional button when switching to joystick
        if (activeButton) {
            activeButton.classList.remove('active-button');
            activeButton = null;
        }
        // Reset joystick handle to center when switching to roll mode
        resetJoystickHandle();
    }
    localStorage.setItem('activeControlMode', mode); // Save the state
    console.log(`Mode switched to: ${currentMode}`);
    // You can add further logic here based on the selected mode
}

// Event listeners for the mode switch buttons
walkModeBtn.addEventListener('click', () => setMode('walk'));
rollModeBtn.addEventListener('click', () => setMode('roll'));


// --- Joystick Logic ---
const joystickBase = document.getElementById('joystickBase');
const joystickHandle = document.getElementById('joystickHandle');

let isDragging = false;
let baseRect; // Stores the bounding rectangle of the joystick base
let baseCenterX, baseCenterY; // Center coordinates of the joystick base
let maxDistance; // Maximum distance the handle can move from the center

// Function to update the joystick base's dimensions and center
function updateJoystickBounds() {
    baseRect = joystickBase.getBoundingClientRect();
    // Calculate the center of the base in screen coordinates
    baseCenterX = baseRect.left + baseRect.width / 2;
    baseCenterY = baseRect.top + baseRect.height / 2;
    // Max distance is the radius of the base minus the radius of the handle
    maxDistance = (baseRect.width / 2) - (joystickHandle.offsetWidth / 2);
}

// Initial update of joystick bounds when the script loads
updateJoystickBounds();
// Update bounds whenever the window is resized to maintain responsiveness
window.addEventListener('resize', updateJoystickBounds);


// Function to reset joystick handle to its centered position
function resetJoystickHandle() {
    // Apply a transform that centers the handle itself (translate(-50%, -50%))
    // and then adds 0px translation for its position relative to the base center.
    joystickHandle.style.transform = 'translate(-50%, -50%)'; // Corrected: Reset to 0,0 relative to center
}

// Mouse/Touch down event for joystick handle (start of drag)
joystickHandle.addEventListener('mousedown', (e) => {
    e.preventDefault(); // Prevent default browser drag behavior (e.g., image dragging)
    isDragging = true;
    updateJoystickBounds(); // Recalculate bounds in case of recent layout changes

    // Play sound when dragging starts
    playClickSound();

    // Add global event listeners for dragging and releasing
    document.addEventListener('mousemove', dragJoystick);
    document.addEventListener('mouseup', stopDragJoystick);
});

joystickHandle.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent scrolling on touch devices
    isDragging = true;
    updateJoystickBounds();

    // Play sound when dragging starts
    playClickSound();

    document.addEventListener('touchmove', dragJoystick);
    document.addEventListener('touchend', stopDragJoystick);
});

// Mouse/Touch move event for dragging
function dragJoystick(e) {
    if (!isDragging) return; // Only drag if the mouse/touch is down

    // Get current mouse/touch coordinates (handling both mouse and touch events)
    const currentX = e.clientX || e.touches[0].clientX;
    const currentY = e.clientY || e.touches[0].clientY;

    // Calculate the handle's desired position relative to the center of the joystick base
    let newX = currentX - baseCenterX;
    let newY = currentY - baseCenterY;

    // Calculate the distance of the desired position from the center
    const distance = Math.sqrt(newX * newX + newY * newY);

    // Constrain the handle within the circular base
    if (distance > maxDistance) {
        // If the distance exceeds the max, scale back the coordinates
        // to be exactly at maxDistance from the center, maintaining the angle.
        const angle = Math.atan2(newY, newX);
        newX = maxDistance * Math.cos(angle);
        newY = maxDistance * Math.sin(angle);
    }

    // Apply the new position using transform.
    // We combine the -50%, -50% (to center the handle's own origin)
    // with the calculated newX and newY offsets.
    joystickHandle.style.transform = `translate(calc(-50% + ${newX}px), calc(-50% + ${newY}px))`;

    // Optional: Log joystick position for debugging or further use
    // console.log(`Joystick position (relative to center): X=${newX.toFixed(2)}, Y=${newY.toFixed(2)}`);
}

// Mouse/Touch up event to stop dragging
function stopDragJoystick() {
    isDragging = false;
    // Remove global event listeners to prevent unintended dragging
    document.removeEventListener('mousemove', dragJoystick);
    document.removeEventListener('mouseup', stopDragJoystick);
    document.removeEventListener('touchmove', dragJoystick);
    document.removeEventListener('touchend', stopDragJoystick);

    // Play sound when dragging stops
    playClickSound();

    // Snap joystick handle back to center
    resetJoystickHandle();
    console.log('Joystick released, snapped to center.');
}

// --- Avoid/Follow Toggle Logic ---
const avoidBtn = document.getElementById('avoidBtn');
const followBtn = document.getElementById('followBtn');

// Function to handle toggle behavior for AVOID/FOLLOW buttons
function toggleAction(clickedButton) {
    playClickSound(); // Play sound on toggle

    // If the clicked button is already active, deactivate it
    if (clickedButton.classList.contains('active-toggle')) {
        clickedButton.classList.remove('active-toggle');
        console.log(`${clickedButton.id} is OFF.`);
    } else {
        // Deactivate the other button if it's active
        if (clickedButton === avoidBtn && followBtn.classList.contains('active-toggle')) {
            followBtn.classList.remove('active-toggle');
            console.log('FOLLOW is OFF.');
        } else if (clickedButton === followBtn && avoidBtn.classList.contains('active-toggle')) {
            avoidBtn.classList.remove('active-toggle');
            console.log('AVOID is OFF.');
        }
        // Activate the clicked button
        clickedButton.classList.add('active-toggle');
        console.log(`${clickedButton.id} is ON.`);
    }

    // Save the current state to localStorage
    let activeAction = 'none';
    if (avoidBtn.classList.contains('active-toggle')) {
        activeAction = 'avoid';
    } else if (followBtn.classList.contains('active-toggle')) {
        activeAction = 'follow';
    }
    localStorage.setItem('activeAction', activeAction);
}

avoidBtn.addEventListener('click', () => toggleAction(avoidBtn));
followBtn.addEventListener('click', () => toggleAction(followBtn));


// --- Theme Switch Logic ---
const themeToggleBtn = document.getElementById('themeToggleBtn'); // Reference to the single toggle button
const body = document.body; // Get a reference to the body element

const sunIconSVG = `<svg class="header-icon" viewBox="0 0 512 512" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><g><g><path d="M256,144c-61.75,0-112,50.25-112,112s50.25,112,112,112s112-50.25,112-112S317.75,144,256,144z M256,336 c-44.188,0-80-35.812-80-80c0-44.188,35.812-80,80-80c44.188,0,80,35.812,80,80C336,300.188,300.188,336,256,336z M256,112 c8.833,0,16-7.167,16-16V64c0-8.833-7.167-16-16-16s-16,7.167-16,16v32C240,104.833,247.167,112,256,112z M256,400 c-8.833,0-16,7.167-16,16v32c0,8.833,7.167,16,16,16s16-7.167,16-16v-32C272,407.167,264.833,400,256,400z M380.438,154.167 l22.625-22.625c6.25-6.25,6.25-16.375,0-22.625s-16.375-6.25-22.625,0l-22.625,22.625c-6.25,6.25-6.25,16.375,0,22.625 S374.188,160.417,380.438,154.167z M131.562,357.834l-22.625,22.625c-6.25,6.249-6.25,16.374,0,22.624s16.375,6.25,22.625,0 l22.625-22.624c6.25-6.271,6.25-16.376,0-22.625C147.938,351.583,137.812,351.562,131.562,357.834z M112,256 c0-8.833-7.167-16-16-16H64c-8.833,0-16,7.167-16,16s7.167,16,16,16h32C104.833,272,112,264.833,112,256z M448,240h-32 c-8.833,0-16,7.167-16,16s7.167,16,16,16h32c8.833,0,16-7.167,16-16S456.833,240,448,240z M131.541,154.167 c6.251,6.25,16.376,6.25,22.625,0c6.251-6.25,6.251-16.375,0-22.625l-22.625-22.625c-6.25-6.25-16.374-6.25-22.625,0 c-6.25,6.25-6.25,16.375,0,22.625L131.541,154.167z M380.459,357.812c-6.271-6.25-16.376-6.25-22.625,0 c-6.251,6.25-6.271,16.375,0,22.625l22.625,22.625c6.249,6.25,16.374,6.25,22.624,0s6.25-16.375,0-22.625L380.459,357.812z" fill="currentColor"/></g></g></svg>`;
const moonIconSVG = `<svg class="header-icon" viewBox="0 0 122.88 122.89" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><g><path d="M49.06,1.27c2.17-0.45,4.34-0.77,6.48-0.98c2.2-0.21,4.38-0.31,6.53-0.29c1.21,0.01,2.18,1,2.17,2.21 c-0.01,0.93-0.6,1.72-1.42,2.03c-9.15,3.6-16.47,10.31-20.96,18.62c-4.42,8.17-6.1,17.88-4.09,27.68l0.01,0.07 c2.29,11.06,8.83,20.15,17.58,25.91c8.74,5.76,19.67,8.18,30.73,5.92l0.07-0.01c7.96-1.65,14.89-5.49,20.3-10.78 c5.6-5.47,9.56-12.48,11.33-20.16c0.27-1.18,1.45-1.91,2.62-1.64c0.89,0.21,1.53,0.93,1.67,1.78c2.64,16.2-1.35,32.07-10.06,44.71 c-8.67,12.58-22.03,21.97-38.18,25.29c-16.62,3.42-33.05-0.22-46.18-8.86C14.52,104.1,4.69,90.45,1.27,73.83 C-2.07,57.6,1.32,41.55,9.53,28.58C17.78,15.57,30.88,5.64,46.91,1.75c0.31-0.08,0.67-0.16,1.06-0.25l0.01,0l0,0L49.06,1.27 L49.06,1.27z" fill="currentColor"/></g></svg>`;

// Function to set the active theme
function setTheme(theme) {
    playClickSound(); // Play sound on theme switch

    if (theme === 'dark') {
        body.classList.remove('light-theme'); // Remove light theme class
        themeToggleBtn.innerHTML = sunIconSVG;
        themeToggleBtn.title = translations[currentLanguage]['themeToggleBtnDark']; // Update tooltip
        localStorage.setItem('theme', 'dark'); // Save theme preference
    } else if (theme === 'light') {
        body.classList.add('light-theme'); // Add light theme class
        themeToggleBtn.innerHTML = moonIconSVG;
        themeToggleBtn.title = translations[currentLanguage]['themeToggleBtnLight']; // Update tooltip
        localStorage.setItem('theme', 'light'); // Save theme preference
    }
    console.log(`Theme switched to: ${theme}`);
}

// Event listener for the single theme toggle button
themeToggleBtn.addEventListener('click', () => {
    // Check current theme based on body class
    if (body.classList.contains('light-theme')) {
        setTheme('dark'); // If currently light, switch to dark
    } else {
        setTheme('light'); // If currently dark, switch to light
    }
});

// --- Mute Switch Logic ---
const muteToggleBtn = document.getElementById('muteToggleBtn');
const speakerIconSVG = `<svg class="header-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4L8 8H4V16H8L12 20V4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.54 8.46C16.48 9.4 17 10.64 17 12C17 13.36 16.48 14.6 15.54 15.54" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const speakerMutedIconSVG = `<svg class="header-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4L8 8H4V16H8L12 20V4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="2" y1="2" x2="22" y2="22" stroke="red" stroke-width="2" stroke-linecap="round"/></svg>`;

function setMuteState(shouldMute) {
    isMuted = shouldMute;
    if (isMuted) {
        muteToggleBtn.innerHTML = speakerMutedIconSVG;
        muteToggleBtn.title = translations[currentLanguage]['unmuteBtnTitle'];
    } else {
        muteToggleBtn.innerHTML = speakerIconSVG;
        muteToggleBtn.title = translations[currentLanguage]['muteBtnTitle'];
    }
    localStorage.setItem('isMuted', isMuted);
    console.log(`Sound is now ${isMuted ? 'Muted' : 'On'}.`);
}

muteToggleBtn.addEventListener('click', () => {
    playClickSound(); // Allow one last click sound before muting
    setMuteState(!isMuted);
});


// --- Language Switch Logic ---
const languageToggleBtn = document.getElementById('languageToggleBtn');
const languageDropdown = document.getElementById('languageDropdown');
const languageButtons = languageDropdown.querySelectorAll('button');
const languageSwitchPanel = document.querySelector('.language-switch-panel'); // Get reference to the panel

// Function to toggle language dropdown visibility
function toggleLanguageDropdown() {
    playClickSound(); // Play sound on dropdown toggle
    connectivityDropdown.style.display = 'none'; // Close connectivity dropdown if open
    languageDropdown.style.display = languageDropdown.style.display === 'flex' ? 'none' : 'flex';
}

// **MODIFIED** Function to handle language selection
async function selectLanguage(event, isInitialLoad = false) {
    if (!isInitialLoad) {
        playClickSound(); // Play sound on language selection
    }

    const button = event.currentTarget;
    const selectedLang = button.dataset.lang;
    console.log(`Language selected: ${selectedLang}`);

    const blocklyLang = blocklyLangMap[selectedLang] || selectedLang;

    try {
        await loadScript(`lib/msg/${blocklyLang}.js`);

        // --- NEW --- Inject custom block translations into Blockly's message object
        const t = translations[selectedLang];
        Blockly.Msg.CONTROLS_FOR_TITLE = `${t.toolboxForLoopFor} %1 ${t.toolboxForLoopFrom} %2 ${t.toolboxForLoopTo} %3 ${t.toolboxForLoopBy} %4`;
        Blockly.Msg.CONTROLS_FOR_DO = t.toolboxForLoopDo;

        translateBlocklyToolbox(selectedLang);

        if (workspace) {
            workspace.updateToolbox(document.getElementById('toolbox'));
            console.log('Blockly toolbox updated for new language.');
        }

        applyTranslations(selectedLang);
        localStorage.setItem('language', selectedLang);

        languageButtons.forEach(btn => btn.classList.remove('active-lang'));
        button.classList.add('active-lang');
        languageDropdown.style.display = 'none';

    } catch (error) {
        console.error(`Failed to switch language to ${selectedLang}:`, error);
        logToConsole(`Error: Could not load language pack for ${selectedLang}. Make sure ${blocklyLang}.js is available.`);
        applyTranslations(selectedLang);
    }
}

// Event listener for the language toggle button
languageToggleBtn.addEventListener('click', toggleLanguageDropdown);

// Event listeners for each language button in the dropdown
languageButtons.forEach(button => {
    button.addEventListener('click', selectLanguage);
});


// --- Connectivity Switch Logic ---
const connectivityToggleBtn = document.getElementById('connectivityToggleBtn');
const connectivityDropdown = document.getElementById('connectivityDropdown');
const connectivityButtons = connectivityDropdown.querySelectorAll('button');
const connectivitySwitchPanel = document.querySelector('.connectivity-switch-panel'); // Get reference to the panel

// Function to toggle connectivity dropdown visibility
function toggleConnectivityDropdown() {
    playClickSound(); // Play sound on dropdown toggle
    languageDropdown.style.display = 'none'; // Close language dropdown if open
    connectivityDropdown.style.display = connectivityDropdown.style.display === 'flex' ? 'none' : 'flex';
}

// Function to handle connectivity selection
function selectConnectivity(event) {
    playClickSound(); // Play sound on connectivity selection
    const selectedConn = event.currentTarget.dataset.conn; // Use currentTarget
    console.log(`Connectivity selected: ${selectedConn}`);

    // Remove active class from all connectivity buttons
    connectivityButtons.forEach(btn => btn.classList.remove('active-conn'));
    // Add active class to the selected connectivity button
    event.currentTarget.classList.add('active-conn'); // Use currentTarget

    currentConnectivity = selectedConn; // Update global current connectivity
    localStorage.setItem('connectivity', selectedConn); // Save connectivity preference

    // Hide the dropdown after selection
    connectivityDropdown.style.display = 'none';

    // You can add further logic here based on the selected connectivity type
    // e.g., initialize Wi-Fi, BLE, or Serial connections
}

// Event listener for the connectivity toggle button
connectivityToggleBtn.addEventListener('click', toggleConnectivityDropdown);

// Event listeners for each connectivity button in the dropdown
connectivityButtons.forEach(button => {
    button.addEventListener('click', selectConnectivity);
});


// Close dropdowns if clicked outside
document.addEventListener('click', (event) => {
    // Check if the click was outside the language switch panel
    if (!languageSwitchPanel.contains(event.target) && languageDropdown.style.display === 'flex') {
        languageDropdown.style.display = 'none';
    }
    // Check if the click was outside the connectivity switch panel
    if (!connectivitySwitchPanel.contains(event.target) && connectivityDropdown.style.display === 'flex') {
        connectivityDropdown.style.display = 'none';
    }
});

// --- Main Tab Logic (Control vs. Code) ---
const controlTabBtn = document.getElementById('controlTabBtn');
const codeTabBtn = document.getElementById('codeTabBtn');
const mainTabButtons = document.querySelectorAll('.tab-panel button'); // Renamed for clarity

function showTabContent(tabId) {
    playClickSound(); // Play sound on tab switch

    // Remove active class from all main tab buttons
    mainTabButtons.forEach(btn => btn.classList.remove('active-tab'));

    // Add active class to the clicked main tab button
    document.getElementById(tabId).classList.add('active-tab');

    // Show/hide content areas based on tab
    if (tabId === 'controlTabBtn') {
        mainContentArea.style.display = 'flex'; // Show control panels
        codeContentArea.style.display = 'none'; // Hide code content
    } else if (tabId === 'codeTabBtn') {
        mainContentArea.style.display = 'none'; // Hide control panels
        codeContentArea.style.display = 'flex'; // Show code content
        // Initialize Blockly if it hasn't been already
        if (!workspace) {
            initBlockly();
            loadIndexedDB();
        }
        // Load and apply the persisted interpreter tab state
        const savedInterpreterTab = localStorage.getItem('activeInterpreterTab') || 'blocks';
        const savedTextOnlyMode = localStorage.getItem('isTextOnlyMode') === 'true';
        
        isTextOnlyMode = savedTextOnlyMode; // Update global state
        textOnlyModeToggle.checked = savedTextOnlyMode; // Update checkbox UI
        showInterpreterTab(savedInterpreterTab); // Apply the saved tab
    }
    localStorage.setItem('activeMainTab', tabId); // Save the active main tab
    console.log(`Switched to main tab: ${tabId}`);
}

controlTabBtn.addEventListener('click', () => showTabContent('controlTabBtn'));
codeTabBtn.addEventListener('click', () => showTabContent('codeTabBtn'));


// --- Interpreter-specific UI Elements ---
const codeEditorDiv = document.getElementById('codeEditor');
const newFileBtn = document.getElementById('newFileBtn'); 
const loadFileBtn = document.getElementById('loadFileBtn');
const saveFileBtn = document.getElementById('saveFileBtn');
const runCodeBtn = document.getElementById('runCodeBtn');
const stopCodeBtn = document.getElementById('stopCodeBtn');
const clearConsoleBtn = document.getElementById('clearConsoleBtn');
const consoleOutput = document.getElementById('consoleOutput');

// Interpreter's internal tab elements
const blocksTabBtn = document.getElementById('blocksTabBtn');
const textTabBtn = document.getElementById('textTabBtn');
const textEditorArea = document.getElementById('textEditorArea');
const blocksEditorArea = document.getElementById('blocksEditorArea');
const textOnlyModeToggle = document.getElementById('textOnlyModeToggle');
// The container for text-only mode toggle is now embedded, so we don't need a separate reference for its parent div.

// Interpreter State
let activeEditor = 'blocks'; // 'text' or 'blocks' - Default for interpreter
let isTextOnlyMode = false; // State for text-only mode
let isInterpreterRunning = false; // --- NEW --- State for interpreter

// Blockly Workspace instance
let workspace = null;

/**
 * Appends a message to the console output.
 * @param {string} message The message to append.
 */
function logToConsole(message) {
    const now = new Date();
    const timestamp = now.toLocaleTimeString();
    consoleOutput.textContent += `[${timestamp}] ${message}\n`;
    consoleOutput.scrollTop = consoleOutput.scrollHeight; // Scroll to bottom
}

// --- Interpreter Internal Tab Switching Logic (Blocks vs. Text) ---
function showInterpreterTab(tabName) {
    playClickSound(); // Play sound on internal tab switch

    // Hide all interpreter tab content first
    textEditorArea.classList.remove('active');
    blocksEditorArea.classList.remove('active');
    blocksTabBtn.classList.remove('active');
    textTabBtn.classList.remove('active');

    if (tabName === 'blocks') {
        blocksTabBtn.classList.add('active');
        blocksEditorArea.classList.add('active');
        activeEditor = 'blocks';
        // Make text editor read-only when blocks are active
        codeEditorDiv.contentEditable = 'false';
        codeEditorDiv.style.cursor = 'not-allowed'; // Visual cue
        // Disable text-only toggle when in blocks mode
        textOnlyModeToggle.checked = false; // Uncheck it
        textOnlyModeToggle.disabled = true; // Disable it
        isTextOnlyMode = false; // Reset text-only mode
        blocksTabBtn.disabled = false; // Ensure blocks tab is enabled when in blocks mode

        // Resize Blockly workspace if it's visible to ensure correct rendering
        if (workspace) {
            Blockly.svgResize(workspace);
        }
    } else { // tabName === 'text'
        textTabBtn.classList.add('active');
        textEditorArea.classList.add('active');
        activeEditor = 'text';
        // Enable text-only toggle when in text mode
        textOnlyModeToggle.disabled = false; // Enable it
        // Set text editor editable based on textOnlyModeToggle state
        codeEditorDiv.contentEditable = isTextOnlyMode ? 'true' : 'false';
        codeEditorDiv.style.cursor = isTextOnlyMode ? 'text' : 'not-allowed';

        // If text-only mode is active, disable the blocks tab
        blocksTabBtn.disabled = isTextOnlyMode;
    }
    localStorage.setItem('activeInterpreterTab', tabName); // Save the state
    console.log(`Interpreter tab switched to: ${tabName}`);
}

blocksTabBtn.addEventListener('click', () => showInterpreterTab('blocks'));
textTabBtn.addEventListener('click', () => showInterpreterTab('text'));

textOnlyModeToggle.addEventListener('change', () => {
    playClickSound(); // Play sound on toggle change
    isTextOnlyMode = textOnlyModeToggle.checked;
    localStorage.setItem('isTextOnlyMode', isTextOnlyMode); // Save the state
    // Re-apply tab state to ensure consistency based on new isTextOnlyMode value
    showInterpreterTab('text');
});


// --- File Operations ---

// Default workspace content
const DEFAULT_WORKSPACE_XML =
    '<xml xmlns="https://developers.google.com/blockly/xml">' +
    '  <block type="arduino_setup" deletable="false" x="70" y="70">' +
    '    <statement name="DO">' +
    '    </statement>' +
    '  </block>' +
    '  <block type="arduino_loop" deletable="false" x="70" y="250">' +
    '    <statement name="DO">' +
    '    </statement>' +
    '  </block>' +
    '</xml>';

// Function to create a blank sketch
function createNewSketch() {
    try {
        workspace.clear();
        const xml = Blockly.Xml.textToDom(DEFAULT_WORKSPACE_XML);
        Blockly.Xml.domToWorkspace(xml, workspace);
        logToConsole('New sketch created.');
    } catch (error) {
        logToConsole(`Error creating new sketch: ${error.message}`);
        console.error('Error creating new sketch:', error);
    }
}

newFileBtn.addEventListener('click', () => {
    playClickSound();
    const messageKey = (activeEditor === 'blocks') 
        ? 'confirmDeleteBlocksTitle' 
        : 'confirmDeleteSketchTitle';
    
    showConfirmationDialog(messageKey, () => {
        createNewSketch();
    });
});

loadFileBtn.addEventListener('click', () => {
    playClickSound(); // Add sound effect
    const fileInput = document.createElement('input'); // Create new input each time
    fileInput.type = 'file';
    fileInput.style.display = 'none'; // Keep it hidden

    if (activeEditor === 'blocks') {
        fileInput.accept = '.xml';
        logToConsole('Ready to load Blockly XML file.');
    } else { // activeEditor === 'text'
        fileInput.accept = '.ino,.c,.txt';
        logToConsole('Ready to load Arduino text file.');
    }

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const fileContent = e.target.result;
                const fileName = file.name;
                const fileExtension = fileName.split('.').pop().toLowerCase();

                if (fileExtension === 'xml') {
                    try {
                        const xml = Blockly.Xml.textToDom(fileContent);
                        workspace.clear(); // Clear existing blocks
                        Blockly.Xml.domToWorkspace(xml, workspace);
                        updateCodeFromBlockly(); // Update text editor from new blocks
                        logToConsole(`Blockly XML file "${fileName}" loaded.`);
                        showInterpreterTab('blocks'); // Switch to blocks tab after loading XML
                    } catch (error) {
                        logToConsole(`Error loading Blockly XML file "${fileName}": ${error.message}`);
                        console.error(`Error loading Blockly XML file. It might be corrupted or invalid.`);
                    }
                } else if (['ino', 'c', 'txt'].includes(fileExtension)) {
                    codeEditorDiv.querySelector('code').textContent = fileContent;
                    Prism.highlightElement(codeEditorDiv.querySelector('code'));
                    logToConsole(`File "${fileName}" loaded.`);
                    showInterpreterTab('text'); // Switch to text tab after loading text file
                } else {
                    logToConsole(`Unsupported file type: .${fileExtension}`);
                    console.error(`Unsupported file type. Please select a .xml, .ino, .c, or .txt file.`);
                }
            };
            reader.onerror = () => {
                logToConsole(`Error reading file: ${file.name}`);
                console.error(`Error reading file: ${file.name}`);
            };
            reader.readAsText(file);
        }
        document.body.removeChild(fileInput); // Remove the temporary input after use
    });

    document.body.appendChild(fileInput); // Append to body
    fileInput.click(); // Trigger the file input click
});

saveFileBtn.addEventListener('click', () => {
    playClickSound(); // Add sound effect
    saveFile();
});

function saveFile() {
    let content;
    let filename;
    let mimeType;

    if (activeEditor === 'blocks' && workspace) {
        // Save Blockly XML
        const xml = Blockly.Xml.workspaceToDom(workspace);
        content = Blockly.Xml.domToText(xml);
        filename = 'blockly_blocks.xml';
        mimeType = 'text/xml';
        logToConsole('Blockly XML saved to file.');
    } else {
        // Save Arduino .ino code (text editor content)
        content = codeEditorDiv.querySelector('code').textContent;
        filename = 'interpreter_code.ino';
        mimeType = 'text/plain';
        logToConsole('Arduino code saved to file.');
    }

    const blob = new Blob([content], { type: mimeType });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
}

/**
 * Displays a generic confirmation dialog.
 * @param {string} messageKey The i18n key for the message to display.
 * @param {function} onConfirm The callback function to execute if the user clicks "OK".
 */
function showConfirmationDialog(messageKey, onConfirm) {
    const dialogOverlay = document.getElementById('confirmDialogOverlay');
    const dialogBox = document.getElementById('confirmDialogBox');
    const dialogText = document.getElementById('confirmDialogText');
    const okBtn = document.getElementById('confirmDialogOkBtn');
    const cancelBtn = document.getElementById('confirmDialogCancelBtn');

    // Set the message from translations
    dialogText.textContent = translations[currentLanguage][messageKey] || messageKey;
    
    // Show the dialog
    dialogOverlay.style.display = 'block';
    dialogBox.style.display = 'block';

    const cleanup = () => {
        dialogOverlay.style.display = 'none';
        dialogBox.style.display = 'none';
        okBtn.removeEventListener('click', okListener);
        cancelBtn.removeEventListener('click', cancelListener);
    };

    const okListener = () => {
        playClickSound();
        if (onConfirm) {
            onConfirm();
        }
        cleanup();
    };

    const cancelListener = () => {
        playClickSound();
        cleanup();
    };

    okBtn.addEventListener('click', okListener);
    cancelBtn.addEventListener('click', cancelListener);
}

// --- IndexedDB Operations ---
const DB_NAME = 'InterpreterDB';
const STORE_NAME = 'codeStore';

// Define keys for different types of stored content
const DB_KEYS = {
    TEXT_CODE: 'textCode',
    BLOCKLY_XML: 'blocklyXml'
};

/**
 * Opens the IndexedDB database.
 * @returns {Promise<IDBDatabase>} A promise that resolves with the database object.
 */
function openIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            logToConsole(`IndexedDB error: ${event.target.errorCode}`);
            reject(event.target.errorCode);
        };
    });
}

/**
 * Saves the current text code to IndexedDB.
 */
function saveTextCodeToIndexedDB() {
    openIndexedDB()
        .then(db => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const code = codeEditorDiv.querySelector('code').textContent;
            const request = store.put({ id: DB_KEYS.TEXT_CODE, content: code });

            request.onsuccess = () => {
                logToConsole('Text code saved to local storage (IndexedDB).');
            };
            request.onerror = (event) => {
                logToConsole(`Error saving text code to IndexedDB: ${event.target.error}`);
                console.error('Error saving text code to local storage.');
            };
        })
        .catch(error => {
            logToConsole(`Error opening IndexedDB for text code save: ${error}`);
            console.error('Error opening local storage for text code.');
        });
}

/**
 * Saves the current Blockly XML to IndexedDB.
 */
function saveBlocklyXmlToIndexedDB() {
    if (!workspace) {
        console.warn('Workspace not initialized, cannot save Blockly XML.');
        return;
    }
    openIndexedDB()
        .then(db => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const xml = Blockly.Xml.workspaceToDom(workspace);
            const xmlText = Blockly.Xml.domToText(xml);
            const request = store.put({ id: DB_KEYS.BLOCKLY_XML, content: xmlText });

            request.onsuccess = () => {
                logToConsole('Blockly XML saved to local storage (IndexedDB).');
            };
            request.onerror = (event) => {
                logToConsole(`Error saving Blockly XML to IndexedDB: ${event.target.error}`);
                console.error('Error saving Blockly XML to local storage.');
            };
        })
        .catch(error => {
            logToConsole(`Error opening IndexedDB for Blockly XML save: ${error}`);
            console.error('Error opening local storage for Blockly XML.');
        });
}


/**
 * Loads content from IndexedDB, prioritizing Blockly XML.
 */
async function loadIndexedDB() {
    try {
        const db = await openIndexedDB();
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);

        let loadedContent = false;

        // Try to load Blockly XML first
        const blocklyRequest = store.get(DB_KEYS.BLOCKLY_XML);
        await new Promise(resolve => {
            blocklyRequest.onsuccess = () => resolve();
            blocklyRequest.onerror = () => resolve(); // Resolve even on error to try text code
        });

        if (blocklyRequest.result && blocklyRequest.result.content) {
            try {
                const xml = Blockly.Xml.textToDom(blocklyRequest.result.content);
                workspace.clear(); // Clear default blocks before loading saved ones
                Blockly.Xml.domToWorkspace(xml, workspace);
                updateCodeFromBlockly(); // This also saves the new text code
                logToConsole('Blockly XML loaded from local storage.');
                loadedContent = true;
            } catch (error) {
                logToConsole(`Error parsing saved Blockly XML: ${error.message}. Attempting to load text code.`);
                // Continue to load text code if XML parsing fails
            }
        }

        // If Blockly XML not found or failed, try to load text code
        if (!loadedContent) {
            const textRequest = store.get(DB_KEYS.TEXT_CODE);
            await new Promise(resolve => {
                textRequest.onsuccess = () => resolve();
                textRequest.onerror = () => resolve();
            });

            if (textRequest.result && textRequest.result.content) {
                codeEditorDiv.querySelector('code').textContent = textRequest.result.content;
                Prism.highlightElement(codeEditorDiv.querySelector('code'));
                logToConsole('Text code loaded from local storage.');
                loadedContent = true;
            }
        }

        // If no saved content (neither blocks nor text) was loaded, load default blocks
        if (!loadedContent) {
            try {
                const xml = Blockly.Xml.textToDom(DEFAULT_WORKSPACE_XML);
                workspace.clear();
                Blockly.Xml.domToWorkspace(xml, workspace);
                updateCodeFromBlockly(); // Generate code for the default blocks and save
                logToConsole('No saved code found. Default blocks loaded.');
            } catch (e) {
                console.error('Error initializing default Blockly blocks:', e);
                console.error('Error initializing default Blockly blocks. Check console for details.');
            }
        }

    } catch (error) {
        logToConsole(`Error during IndexedDB load: ${error}`);
        console.error('Error loading code from local storage.');
    }
}


// --- Event Listeners for Interpreter Action Buttons ---
runCodeBtn.addEventListener('click', () => {
    playClickSound();
    const code = codeEditorDiv.querySelector('code').textContent;
    runInterpreter(code);
});

stopCodeBtn.addEventListener('click', () => {
    playClickSound();
    isInterpreterRunning = false; // Signal the interpreter to stop
    logToConsole('Interpreter stop requested.');
});

clearConsoleBtn.addEventListener('click', () => {
    playClickSound();
    consoleOutput.textContent = '';
    logToConsole('Console cleared.');
});


async function runInterpreter(code) {
    if (isInterpreterRunning) {
        logToConsole('Interpreter is already running.');
        return;
    }

    isInterpreterRunning = true;
    runCodeBtn.disabled = true;
    stopCodeBtn.disabled = false;
    logToConsole('Interpreter starting (Parser Pass)...');

    try {
        const lexer = new Lexer(code);
        const parser = new Parser(lexer);
        const ast = parser.parse();

        logToConsole("--- Abstract Syntax Tree ---");
        const astString = prettyPrintAST(ast);
        logToConsole(astString);
        logToConsole("--- Parser Pass Complete ---");


    } catch (error) {
        // Check if it's our custom parser error or a generic one
        if (error instanceof ParserError) {
            logToConsole(error.message); // The message is already detailed
        } else {
            logToConsole(`Interpreter Error: ${error.message}`);
            console.error(error); // Log the full stack for other types of errors
        }
    } finally {
        // --- Cleanup ---
        logToConsole('Interpreter stopped.');
        isInterpreterRunning = false;
        runCodeBtn.disabled = false;
        stopCodeBtn.disabled = true;
    }
}

// --- Automatic Saving with Debounce ---
const AUTO_SAVE_DELAY = 1000; // 1 second delay after last keystroke

function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

const debouncedSaveTextCodeToIndexedDB = debounce(saveTextCodeToIndexedDB, AUTO_SAVE_DELAY);
const debouncedSaveBlocklyXmlToIndexedDB = debounce(saveBlocklyXmlToIndexedDB, AUTO_SAVE_DELAY);


// Listen for input changes in the code editor and trigger debounced save and re-highlight
codeEditorDiv.addEventListener('input', () => {
    if (activeEditor === 'text' && isTextOnlyMode) { // Only auto-save if text editor is actively being typed in AND in text-only mode
        const plainText = codeEditorDiv.querySelector('code').textContent;
        codeEditorDiv.querySelector('code').textContent = plainText;
        Prism.highlightElement(codeEditorDiv.querySelector('code'));
        debouncedSaveTextCodeToIndexedDB();
    }
});


// --- Blockly Custom Blocks and Generators ---

// --- MODIFIED --- Block definition for 'controls_for' to be horizontal and translatable
Blockly.Blocks['controls_for'] = {
  init: function() {
    this.jsonInit({
        "message0": "%{BKY_CONTROLS_FOR_TITLE}",
        "args0": [
            {
                "type": "field_variable",
                "name": "VAR",
                "variable": "i"
            },
            {
                "type": "input_value",
                "name": "FROM",
                "check": "Number",
                "align": "RIGHT"
            },
            {
                "type": "input_value",
                "name": "TO",
                "check": "Number",
                "align": "RIGHT"
            },
            {
                "type": "input_value",
                "name": "BY",
                "check": "Number",
                "align": "RIGHT"
            }
        ],
        "message1": "%{BKY_CONTROLS_FOR_DO} %1",
        "args1": [
            {
                "type": "input_statement",
                "name": "DO"
            }
        ],
        "inputsInline": true,
        "previousStatement": null,
        "nextStatement": null,
        "colour": "%{BKY_LOOPS_HUE}",
        "tooltip": "A C-style for loop.",
        "helpUrl": "https://www.arduino.cc/reference/en/language/structure/control-structure/for/"
    });
  }
};

// --- NEW --- Block definitions for new Math blocks
Blockly.Blocks['math_sq'] = {
  init: function() {
    this.jsonInit({
      "message0": "sq( %1 )",
      "args0": [
        {
          "type": "input_value",
          "name": "NUM",
          "check": "Number"
        }
      ],
      "output": "Number",
      "colour": "%{BKY_MATH_HUE}",
      "tooltip": "Returns the square of a number.",
      "helpUrl": "https://www.arduino.cc/reference/en/language/functions/math/sq/"
    });
  }
};

Blockly.Blocks['math_map'] = {
  init: function() {
    this.jsonInit({
      "message0": "map( %1, from %2, to %3, to %4, %5 )",
      "args0": [
        {"type": "input_value", "name": "VALUE", "check": "Number"},
        {"type": "input_value", "name": "FROMLOW", "check": "Number"},
        {"type": "input_value", "name": "FROMHIGH", "check": "Number"},
        {"type": "input_value", "name": "TOLOW", "check": "Number"},
        {"type": "input_value", "name": "TOHIGH", "check": "Number"}
      ],
      "output": "Number",
      "inputsInline": true,
      "colour": "%{BKY_MATH_HUE}",
      "tooltip": "Re-maps a number from one range to another.",
      "helpUrl": "https://www.arduino.cc/reference/en/language/functions/math/map/"
    });
  }
};

Blockly.Blocks['math_min'] = {
  init: function() {
    this.jsonInit({
      "message0": "min( %1, %2 )",
      "args0": [
        {"type": "input_value", "name": "A", "check": "Number"},
        {"type": "input_value", "name": "B", "check": "Number"}
      ],
      "output": "Number",
      "inputsInline": true,
      "colour": "%{BKY_MATH_HUE}",
      "tooltip": "Calculates the minimum of two numbers.",
      "helpUrl": "https://www.arduino.cc/reference/en/language/functions/math/min/"
    });
  }
};

Blockly.Blocks['math_max'] = {
  init: function() {
    this.jsonInit({
      "message0": "max( %1, %2 )",
      "args0": [
        {"type": "input_value", "name": "A", "check": "Number"},
        {"type": "input_value", "name": "B", "check": "Number"}
      ],
      "output": "Number",
      "inputsInline": true,
      "colour": "%{BKY_MATH_HUE}",
      "tooltip": "Calculates the maximum of two numbers.",
      "helpUrl": "https://www.arduino.cc/reference/en/language/functions/math/max/"
    });
  }
};


// Define the 'setup' block
Blockly.Blocks['arduino_setup'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("void setup()");
        this.appendStatementInput("DO")
            .setCheck(null);
        this.setColour(230); // A distinct color for Arduino blocks
        this.setTooltip("The setup() function is called once when your program starts.");
        this.setHelpUrl("https://www.arduino.cc/reference/en/language/structure/overview/setup/");
    }
};
// Define the 'loop' block
Blockly.Blocks['arduino_loop'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("void loop()");
        this.appendStatementInput("DO")
            .setCheck(null);
        this.setColour(230); // A distinct color for Arduino blocks
        this.setTooltip("The loop() function is executed repeatedly after setup().");
        this.setHelpUrl("https://www.arduino.cc/reference/en/language/structure/overview/loop/");
    }
};

// Define the 'pinMode' block
Blockly.Blocks['pin_mode'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("pinMode(")
            .appendField(new Blockly.FieldNumber(0), "PIN")
            .appendField(", ")
            .appendField(new Blockly.FieldDropdown([["OUTPUT", "OUTPUT"], ["INPUT", "INPUT"], ["INPUT_PULLUP", "INPUT_PULLUP"]]), "MODE")
            .appendField(")");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
        this.setTooltip("Sets the digital pin to INPUT, OUTPUT, or INPUT_PULLUP.");
        this.setHelpUrl("https://www.arduino.cc/reference/en/language/functions/digital-io/pinmode/");
    }
};

// Define the 'digitalWrite' block
Blockly.Blocks['digital_write'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("digitalWrite(")
            .appendField(new Blockly.FieldNumber(0), "PIN")
            .appendField(", ")
            .appendField(new Blockly.FieldDropdown([["HIGH", "HIGH"], ["LOW", "LOW"]]), "VALUE")
            .appendField(")");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
        this.setTooltip("Write a HIGH or a LOW value to a digital pin.");
        this.setHelpUrl("https://www.arduino.cc/reference/en/language/functions/digital-io/digitalwrite/");
    }
};

// Define the 'digitalRead' block
Blockly.Blocks['digital_read'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("digitalRead(")
            .appendField(new Blockly.FieldNumber(0), "PIN")
            .appendField(")");
        this.setOutput(true, "Number");
        this.setColour(230);
        this.setTooltip("Reads the value from a specified digital pin, either HIGH or LOW.");
        this.setHelpUrl("https://www.arduino.cc/reference/en/language/functions/digital-io/digitalread/");
    }
};

// Define the 'analogWrite' block
Blockly.Blocks['analog_write'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("analogWrite(")
            .appendField(new Blockly.FieldNumber(0), "PIN")
            .appendField(", ")
            .appendField(new Blockly.FieldNumber(0, 0, 255), "VALUE") // Value from 0-255
            .appendField(")");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
        this.setTooltip("Writes an analog value (PWM wave) to a pin.");
        this.setHelpUrl("https://www.arduino.cc/reference/en/language/functions/analog-io/analogwrite/");
    }
};

// Define the 'analogRead' block
Blockly.Blocks['analog_read'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("analogRead(")
            .appendField(new Blockly.FieldNumber(0), "PIN")
            .appendField(")");
        this.setOutput(true, "Number");
        this.setColour(230);
        this.setTooltip("Reads the value from the specified analog pin.");
        this.setHelpUrl("https://www.arduino.cc/reference/en/language/functions/analog-io/analogread/");
    }
};

// Define the 'delay' block
Blockly.Blocks['delay_ms'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("delay(")
            .appendField(new Blockly.FieldNumber(1000), "MILLISECONDS")
            .appendField(")");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
        this.setTooltip("Pauses the program for the amount of time (in milliseconds) specified as parameter.");
        this.setHelpUrl("https://www.arduino.cc/reference/en/language/functions/time/delay/");
    }
};

// Define the 'Serial.begin' block
Blockly.Blocks['serial_begin'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("Serial.begin(")
            .appendField(new Blockly.FieldNumber(9600), "BAUD_RATE")
            .appendField(")");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
        this.setTooltip("Sets the data rate in bits per second (baud) for serial data transmission.");
        this.setHelpUrl("https://www.arduino.cc/reference/en/language/functions/communication/serial/begin/");
    }
};

// Define the 'Serial.println' block
Blockly.Blocks['serial_println'] = {
    init: function() {
        this.appendValueInput("TEXT")
            .setCheck(["String", "Number", "Boolean"])
            .appendField("Serial.println(");
        this.appendDummyInput()
            .appendField(")");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
        this.setTooltip("Prints data to the serial port followed by a carriage return and newline character.");
        this.setHelpUrl("https://www.arduino.cc/reference/en/language/functions/communication/serial/println/");
    }
};

// --- Blockly C Generator ---
// Create a custom generator for C-like code
Blockly.C = new Blockly.Generator('C');

// --- FIX: Add reserved words for C/Arduino ---
Blockly.C.RESERVED_WORDS_ =
    // C Keywords
    'auto,break,case,char,const,continue,default,do,double,else,enum,extern,float,for,goto,if,int,long,register,return,short,signed,sizeof,static,struct,switch,typedef,union,unsigned,void,volatile,while,' +
    // Arduino Keywords
    'HIGH,LOW,INPUT,OUTPUT,INPUT_PULLUP,true,false,boolean,byte,word,String,array,setup,loop,pinMode,digitalWrite,digitalRead,analogWrite,analogRead,delay,millis,micros,abs,constrain,map,max,min,pow,sq,sqrt,sin,cos,tan,randomSeed,random,lowByte,highByte,bitRead,bitWrite,bitSet,bitClear,bit,attachInterrupt,detachInterrupt,interrupts,noInterrupts,Serial,Stream,Keyboard,Mouse';


// Order of operation for C-like code
Blockly.C.ORDER_ATOMIC = 0; // 0 ""
Blockly.C.ORDER_MEMBER = 1; // . []
Blockly.C.ORDER_FUNCTION_CALL = 2; // ()
Blockly.C.ORDER_INC_DEC = 3; // ++ --
Blockly.C.ORDER_UNARY_PREFIX = 4; // ! ~ - +
Blockly.C.ORDER_MULTIPLICATIVE = 5; // * / %
Blockly.C.ORDER_ADDITIVE = 6; // + -
Blockly.C.ORDER_SHIFT = 7; // << >>
Blockly.C.ORDER_RELATIONAL = 8; // < <= > >=
Blockly.C.ORDER_EQUALITY = 9; // == !=
Blockly.C.ORDER_BITWISE_AND = 10; // &
Blockly.C.ORDER_BITWISE_XOR = 11; // ^
Blockly.C.ORDER_BITWISE_OR = 12; // |
Blockly.C.ORDER_LOGICAL_AND = 13; // &&
Blockly.C.ORDER_LOGICAL_OR = 14; // ||
Blockly.C.ORDER_CONDITIONAL = 15; // ?:
Blockly.C.ORDER_ASSIGNMENT = 16; // = += -= *= /= %= <<= >>= &= ^= |=
Blockly.C.ORDER_COMMA = 17; // ,
Blockly.C.ORDER_NONE = 99; // no precedence

// Setup for the C code generation
Blockly.C.init = function(workspace) {
    // Create a dictionary of definitions to be printed at the top of the code.
    Blockly.C.definitions_ = Object.create(null);
    // Create a dictionary mapping desired function names in C to ones that
    // are actually being used (to avoid collisions with user functions).
    Blockly.C.functionNames_ = Object.create(null);

    // --- FIX: Initialize the variableDB ---
    if (!Blockly.C.variableDB_) {
        Blockly.C.variableDB_ =
            new Blockly.Names(Blockly.C.RESERVED_WORDS_);
    } else {
        Blockly.C.variableDB_.reset();
    }
    Blockly.C.variableDB_.setVariableMap(workspace.getVariableMap());
    // --- END FIX ---

    // Explicitly set indentation
    Blockly.C.INDENT = '  '; // Two spaces for indentation
};

Blockly.C.finish = function(code) {
    // Indent every line.
    if (code) {
        code = Blockly.C.prefixLines(code, Blockly.C.INDENT);
    }
    // Convert definitions to a string.
    let definitions = '';
    for (const name in Blockly.C.definitions_) {
        definitions += Blockly.C.definitions_[name] + '\n';
    }
    return definitions + code;
};

// This is the crucial part for concatenating blocks in a statement.
// It's usually provided by Blockly.Generator, but we'll define it explicitly for clarity.
Blockly.C.scrub_ = function(block, code, opt_thisOnly) {
    const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
    let nextCode = opt_thisOnly ? '' : Blockly.C.blockToCode(nextBlock);
    return code + nextCode;
};


// Generator for 'arduino_setup' block
Blockly.C['arduino_setup'] = function(block) {
    const statements_do = Blockly.C.statementToCode(block, 'DO');
    console.log('Generated setup statements (raw):', statements_do); // Debug log
    Blockly.C.definitions_['setup_function'] = `void setup() {\n${statements_do}}`;
    return ''; // This block doesn't directly return code to the main flow, it defines a function
};

// Generator for 'arduino_loop' block
Blockly.C['arduino_loop'] = function(block) {
    const statements_do = Blockly.C.statementToCode(block, 'DO');
    console.log('Generated loop statements (raw):', statements_do); // Debug log
    Blockly.C.definitions_['loop_function'] = `void loop() {\n${statements_do}}`;
    return ''; // This block doesn't directly return code to the main flow, it defines a function
};

// Generator for 'pin_mode' block
Blockly.C['pin_mode'] = function(block) {
    const pin = block.getFieldValue('PIN');
    const mode = block.getFieldValue('MODE');
    const code = `pinMode(${pin}, ${mode});\n`;
    console.log(`Generated pinMode: ${code.trim()}`); // Debug log
    return code;
};

// Generator for 'digital_write' block
Blockly.C['digital_write'] = function(block) {
    const pin = block.getFieldValue('PIN');
    const value = block.getFieldValue('VALUE');
    const code = `digitalWrite(${pin}, ${value});\n`;
    console.log(`Generated digitalWrite: ${code.trim()}`); // Debug log
    return code;
};

// Generator for 'digital_read' block
Blockly.C['digital_read'] = function(block) {
    const pin = block.getFieldValue('PIN');
    const code = `digitalRead(${pin})`;
    console.log(`Generated digitalRead: ${code.trim()}`); // Debug log
    return [code, Blockly.C.ORDER_FUNCTION_CALL];
};

// Generator for 'analog_write' block
Blockly.C['analog_write'] = function(block) {
    const pin = block.getFieldValue('PIN');
    const value = block.getFieldValue('VALUE');
    const code = `analogWrite(${pin}, ${value});\n`;
    console.log(`Generated analogWrite: ${code.trim()}`); // Debug log
    return code;
};

// Generator for 'analog_read' block
Blockly.C['analog_read'] = function(block) {
    const pin = block.getFieldValue('PIN');
    const code = `analogRead(${pin})`;
    console.log(`Generated analogRead: ${code.trim()}`); // Debug log
    return [code, Blockly.C.ORDER_FUNCTION_CALL];
};

// Generator for 'delay_ms' block
Blockly.C['delay_ms'] = function(block) {
    const milliseconds = block.getFieldValue('MILLISECONDS');
    const code = `delay(${milliseconds});\n`;
    console.log(`Generated delay_ms: ${code.trim()}`); // Debug log
    return code;
};

// Generator for 'serial_begin' block
Blockly.C['serial_begin'] = function(block) {
    const baud_rate = block.getFieldValue('BAUD_RATE');
    const code = `Serial.begin(${baud_rate});\n`;
    console.log(`Generated serial_begin: ${code.trim()}`); // Debug log
    return code;
};

// Generator for 'serial_println' block
Blockly.C['serial_println'] = function(block) {
    const text = Blockly.C.valueToCode(block, 'TEXT', Blockly.C.ORDER_NONE) || '""';
    const code = `Serial.println(${text});\n`;
    console.log(`Generated serial_println: ${code.trim()}`); // Debug log
    return code;
};

// --- FIX: Add Variable Get/Set Generators ---
Blockly.C['variables_get'] = function(block) {
  // Variable getter.
  const code = Blockly.C.variableDB_.getName(block.getFieldValue('VAR'),
      'VARIABLE');
  return [code, Blockly.C.ORDER_ATOMIC];
};

Blockly.C['variables_set'] = function(block) {
  // Variable setter.
  const argument0 = Blockly.C.valueToCode(block, 'VALUE',
      Blockly.C.ORDER_ASSIGNMENT) || '0';
  const varName = Blockly.C.variableDB_.getName(
      block.getFieldValue('VAR'), 'VARIABLE');
  // For Arduino C, we need to declare variables.
  // We'll assume 'int' type for simplicity and declare it in the definitions.
  if (!Blockly.C.definitions_['var_' + varName]) {
    Blockly.C.definitions_['var_' + varName] = 'int ' + varName + ';';
  }
  return varName + ' = ' + argument0 + ';\n';
};

// --- NEW --- Generator for "change variable by" block
Blockly.C['math_change'] = function(block) {
  const argument0 = Blockly.C.valueToCode(block, 'DELTA', Blockly.C.ORDER_ADDITIVE) || '0';
  const varName = Blockly.C.variableDB_.getName(block.getFieldValue('VAR'), 'VARIABLE');
  return varName + ' = ' + varName + ' + ' + argument0 + ';\n';
};


// --- PROCEDURE GENERATORS ---

// Generator for function definition with no return value.
Blockly.C['procedures_defnoreturn'] = function(block) {
  const funcName = Blockly.C.variableDB_.getName(
      block.getFieldValue('NAME'), 'PROCEDURE');
  let branch = Blockly.C.statementToCode(block, 'STACK');
  if (Blockly.C.STATEMENT_PREFIX) {
    branch = Blockly.C.prefixLines(
        Blockly.C.STATEMENT_PREFIX.replace(/%1/g, '\'' + block.id + '\''),
        Blockly.C.INDENT) + branch;
  }
  if (Blockly.C.INFINITE_LOOP_TRAP) {
    branch = Blockly.C.INFINITE_LOOP_TRAP.replace(/%1/g, '\'' + block.id + '\'') +
        branch;
  }
  const args = [];
  const variables = block.getVars();
  for (let i = 0; i < variables.length; i++) {
    // For Arduino, let's assume variables are of type 'int' by default.
    // This is a simplification for this specific application.
    args[i] = 'int ' + Blockly.C.variableDB_.getName(variables[i],
        'VARIABLE');
  }
  let code = 'void ' + funcName + '(' + args.join(', ') + ') {\n' + branch + '}';
  code = Blockly.C.scrub_(block, code);
  // Add to definitions, which are printed before the rest of the code.
  Blockly.C.definitions_[funcName] = code;
  return null;
};

// Generator for function definition with a return value.
Blockly.C['procedures_defreturn'] = function(block) {
  const funcName = Blockly.C.variableDB_.getName(
      block.getFieldValue('NAME'), 'PROCEDURE');
  let branch = Blockly.C.statementToCode(block, 'STACK');
  if (Blockly.C.STATEMENT_PREFIX) {
    branch = Blockly.C.prefixLines(
        Blockly.C.STATEMENT_PREFIX.replace(/%1/g, '\'' + block.id + '\''),
        Blockly.C.INDENT) + branch;
  }
  if (Blockly.C.INFINITE_LOOP_TRAP) {
    branch = Blockly.C.INFINITE_LOOP_TRAP.replace(/%1/g, '\'' + block.id + '\'') +
        branch;
  }
  let returnValue = Blockly.C.valueToCode(block, 'RETURN',
      Blockly.C.ORDER_NONE) || '';
  if (returnValue) {
    returnValue = Blockly.C.INDENT + 'return ' + returnValue + ';\n';
  }
  const args = [];
  const variables = block.getVars();
  for (let i = 0; i < variables.length; i++) {
    args[i] = 'int ' + Blockly.C.variableDB_.getName(variables[i],
        'VARIABLE');
  }
  // Assuming return type is 'int' by default for this application.
  let code = 'int ' + funcName + '(' + args.join(', ') + ') {\n' + branch + returnValue + '}';
  code = Blockly.C.scrub_(block, code);
  Blockly.C.definitions_[funcName] = code;
  return null;
};

// Generator for a function call with no return value.
Blockly.C['procedures_callnoreturn'] = function(block) {
  const funcName = Blockly.C.variableDB_.getName(
      block.getFieldValue('NAME'), 'PROCEDURE');
  const args = [];
  const variables = block.getVars();
  for (let i = 0; i < variables.length; i++) {
    args[i] = Blockly.C.valueToCode(block, 'ARG' + i,
        Blockly.C.ORDER_COMMA) || 'null';
  }
  const code = funcName + '(' + args.join(', ') + ');\n';
  return code;
};

// Generator for a function call with a return value.
Blockly.C['procedures_callreturn'] = function(block) {
  const funcName = Blockly.C.variableDB_.getName(
      block.getFieldValue('NAME'), 'PROCEDURE');
  const args = [];
  const variables = block.getVars();
  for (let i = 0; i < variables.length; i++) {
    args[i] = Blockly.C.valueToCode(block, 'ARG' + i,
        Blockly.C.ORDER_COMMA) || 'null';
  }
  const code = funcName + '(' + args.join(', ') + ')';
  return [code, Blockly.C.ORDER_FUNCTION_CALL];
};

// --- MODIFIED --- Generator for if/return block
Blockly.C['procedures_ifreturn'] = function(block) {
  const condition =
      Blockly.C.valueToCode(block, 'CONDITION', Blockly.C.ORDER_NONE) || 'false';
  let code = 'if (' + condition + ') {\n';
  if (block.hasReturnValue_) {
    const value = Blockly.C.valueToCode(block, 'VALUE', Blockly.C.ORDER_NONE) ||
        'null';
    code += Blockly.C.INDENT + 'return ' + value + ';\n';
  } else {
    code += Blockly.C.INDENT + 'return;\n';
  }
  code += '}\n';
  return code;
};

// --- END OF PROCEDURE GENERATORS ---

// Override default text block to generate C strings
Blockly.C['text'] = function(block) {
    const text = block.getFieldValue('TEXT');
    const code = `"${text}"`;
    console.log(`Generated text: ${code}`); // Debug log
    return [code, Blockly.C.ORDER_ATOMIC];
};

// --- NEW --- Generators for new Text blocks
Blockly.C['text_join'] = function(block) {
    let code = 'String("")'; // Start with an empty String object
    for (let i = 0; i < block.itemCount_; i++) {
        const value = Blockly.C.valueToCode(block, 'ADD' + i, Blockly.C.ORDER_ADDITIVE) || '""';
        code += ` + String(${value})`;
    }
    return [code, Blockly.C.ORDER_ADDITIVE];
};

Blockly.C['text_append'] = function(block) {
    const varName = Blockly.C.variableDB_.getName(block.getFieldValue('VAR'), 'VARIABLE');
    const value = Blockly.C.valueToCode(block, 'TEXT', Blockly.C.ORDER_ADDITIVE) || '""';
    return `${varName} += String(${value});\n`;
};

Blockly.C['text_length'] = function(block) {
    const text = Blockly.C.valueToCode(block, 'VALUE', Blockly.C.ORDER_MEMBER) || '""';
    return [`String(${text}).length()`, Blockly.C.ORDER_FUNCTION_CALL];
};

Blockly.C['text_isEmpty'] = function(block) {
    const text = Blockly.C.valueToCode(block, 'VALUE', Blockly.C.ORDER_MEMBER) || '""';
    return [`(String(${text}).length() == 0)`, Blockly.C.ORDER_EQUALITY];
};


// Override default controls_if to generate C if/else
Blockly.C['controls_if'] = function(block) {
    // If/elseif/else condition.
    let code = '';
    let branchCode;
    let conditionCode;
    for (let i = 0; i <= block.elseifCount_ || block.elseCount_; i++) {
        if (i == 0) {
            conditionCode = Blockly.C.valueToCode(block, 'IF' + i,
                Blockly.C.ORDER_NONE) || 'false';
            branchCode = Blockly.C.statementToCode(block, 'DO' + i);
            code += 'if (' + conditionCode + ') {\n' + branchCode + '}';
        } else if (block.elseifCount_ && i <= block.elseifCount_) {
            conditionCode = Blockly.C.valueToCode(block, 'IF' + i,
                Blockly.C.ORDER_NONE) || 'false';
            branchCode = Blockly.C.statementToCode(block, 'DO' + i);
            code += ' else if (' + conditionCode + ') {\n' + branchCode + '}';
        } else if (block.elseCount_) {
            branchCode = Blockly.C.statementToCode(block, 'ELSE');
            code += ' else {\n' + branchCode + '}';
        }
    }
    console.log(`Generated controls_if: ${code.trim()}`); // Debug log
    return code + '\n';
};

// Generator for 'controls_whileUntil' block
Blockly.C['controls_whileUntil'] = function(block) {
    const until = block.getFieldValue('MODE') === 'UNTIL';
    let argument0 = Blockly.C.valueToCode(block, 'BOOL',
        until ? Blockly.C.ORDER_LOGICAL_NOT : Blockly.C.ORDER_NONE) || 'false';
    let branch = Blockly.C.statementToCode(block, 'DO');
    branch = Blockly.C.addLoopTrap(branch, block);
    if (until) {
        argument0 = '!' + argument0;
    }
    return 'while (' + argument0 + ') {\n' + branch + '}\n';
};


// --- MODIFIED --- Generator for 'controls_repeat_ext' (repeat X times)
Blockly.C['controls_repeat_ext'] = function(block) {
    const repeats = Blockly.C.valueToCode(block, 'TIMES', Blockly.C.ORDER_ASSIGNMENT) || '0';
    let branch = Blockly.C.statementToCode(block, 'DO');
    branch = Blockly.C.addLoopTrap(branch, block);
    let code = '';
    const loopVar = Blockly.C.variableDB_.getDistinctName('count', 'VARIABLE');
    code += `for (int ${loopVar} = 0; ${loopVar} < ${repeats}; ${loopVar}++) {\n${branch}}\n`;
    return code;
};

// --- NEW --- Generator for 'controls_for' block
Blockly.C['controls_for'] = function(block) {
    const variable0 = Blockly.C.variableDB_.getName(block.getFieldValue('VAR'), 'VARIABLE');
    const argument0 = Blockly.C.valueToCode(block, 'FROM', Blockly.C.ORDER_ASSIGNMENT) || '0';
    const argument1 = Blockly.C.valueToCode(block, 'TO', Blockly.C.ORDER_ASSIGNMENT) || '0';
    const increment = Blockly.C.valueToCode(block, 'BY', Blockly.C.ORDER_ASSIGNMENT) || '1';
    let branch = Blockly.C.statementToCode(block, 'DO');
    branch = Blockly.C.addLoopTrap(branch, block);
    let code = '';
    
    // Logic to determine direction of loop
    const from_num = Number(argument0);
    const to_num = Number(argument1);
    const by_num = Math.abs(Number(increment));

    let comparison = '<=';
    let update = `${variable0} += ${by_num}`;

    if (from_num > to_num) {
        comparison = '>='; // Counting down
        update = `${variable0} -= ${by_num}`;
    }
    
    // We declare the loop variable with 'int' for Arduino compatibility
    code += `for (int ${variable0} = ${argument0}; ${variable0} ${comparison} ${argument1}; ${update}) {\n${branch}}\n`;
    
    return code;
};

// --- NEW --- Math Block Generators ---
Blockly.C['math_round'] = function(block) {
    const operator = block.getFieldValue('OP');
    const argument0 = Blockly.C.valueToCode(block, 'NUM', Blockly.C.ORDER_NONE) || '0';
    let code;
    switch (operator) {
        case 'ROUND':
            code = `round(${argument0})`;
            break;
        case 'ROUNDUP':
            code = `ceil(${argument0})`;
            break;
        case 'ROUNDDOWN':
            code = `floor(${argument0})`;
            break;
    }
    if (code) {
        Blockly.C.definitions_['define_math'] = '#include <math.h>';
    }
    return [code, Blockly.C.ORDER_FUNCTION_CALL];
};

Blockly.C['math_single'] = function(block) {
    const operator = block.getFieldValue('OP');
    let code;
    let arg;
    if (operator == 'NEG') {
        arg = Blockly.C.valueToCode(block, 'NUM', Blockly.C.ORDER_UNARY_PREFIX) || '0';
        if (arg[0] == '-') {
            arg = ' ' + arg;
        }
        code = '-' + arg;
        return [code, Blockly.C.ORDER_UNARY_PREFIX];
    }
    Blockly.C.definitions_['define_math'] = '#include <math.h>';
    arg = Blockly.C.valueToCode(block, 'NUM', Blockly.C.ORDER_NONE) || '0';
    switch (operator) {
        case 'ABS': code = `abs(${arg})`; break;
        case 'ROOT': code = `sqrt(${arg})`; break;
        case 'LN': code = `log(${arg})`; break;
        case 'LOG10': code = `log10(${arg})`; break;
        case 'EXP': code = `exp(${arg})`; break;
        case 'POW10': code = `pow(10, ${arg})`; break;
        case 'SQ': code = `sq(${arg})`; break; // --- NEW ---
    }
    return [code, Blockly.C.ORDER_FUNCTION_CALL];
};

Blockly.C['math_trig'] = function(block) {
    const operator = block.getFieldValue('OP');
    const argument0 = Blockly.C.valueToCode(block, 'NUM', Blockly.C.ORDER_NONE) || '0';
    // Arduino trig functions work in radians, Blockly's default is degrees.
    // We need to convert degrees to radians for the C code.
    const radians = `(${argument0} * M_PI / 180)`;
    let code;
    switch (operator) {
        case 'SIN': code = `sin(${radians})`; break;
        case 'COS': code = `cos(${radians})`; break;
        case 'TAN': code = `tan(${radians})`; break;
        case 'ASIN': code = `asin(${argument0}) * 180 / M_PI`; break; // And back
        case 'ACOS': code = `acos(${argument0}) * 180 / M_PI`; break;
        case 'ATAN': code = `atan(${argument0}) * 180 / M_PI`; break;
    }
    if (code) {
        Blockly.C.definitions_['define_math'] = '#include <math.h>';
    }
    return [code, Blockly.C.ORDER_FUNCTION_CALL];
};

Blockly.C['math_constant'] = function(block) {
    const CONSTANTS = {
        'PI': 'M_PI', 'E': 'M_E', 'GOLDEN_RATIO': '1.61803398875',
        'SQRT2': 'M_SQRT2', 'SQRT1_2': 'M_SQRT1_2', 'INFINITY': 'INFINITY'
    };
    const constant = CONSTANTS[block.getFieldValue('CONSTANT')];
    if (constant) {
        Blockly.C.definitions_['define_math'] = '#include <math.h>';
    }
    return [constant, Blockly.C.ORDER_ATOMIC];
};

Blockly.C['math_modulo'] = function(block) {
    const argument0 = Blockly.C.valueToCode(block, 'DIVIDEND', Blockly.C.ORDER_MULTIPLICATIVE) || '0';
    const argument1 = Blockly.C.valueToCode(block, 'DIVISOR', Blockly.C.ORDER_MULTIPLICATIVE) || '0';
    const code = `${argument0} % ${argument1}`;
    return [code, Blockly.C.ORDER_MULTIPLICATIVE];
};

Blockly.C['math_constrain'] = function(block) {
    const argument0 = Blockly.C.valueToCode(block, 'VALUE', Blockly.C.ORDER_COMMA) || '0';
    const argument1 = Blockly.C.valueToCode(block, 'LOW', Blockly.C.ORDER_COMMA) || '0';
    const argument2 = Blockly.C.valueToCode(block, 'HIGH', Blockly.C.ORDER_COMMA) || '0';
    const code = `constrain(${argument0}, ${argument1}, ${argument2})`;
    return [code, Blockly.C.ORDER_FUNCTION_CALL];
};

Blockly.C['math_random_int'] = function(block) {
    const argument0 = Blockly.C.valueToCode(block, 'FROM', Blockly.C.ORDER_COMMA) || '0';
    const argument1 = Blockly.C.valueToCode(block, 'TO', Blockly.C.ORDER_COMMA) || '0';
    // Arduino's random(min, max) is exclusive of max, so we add 1
    const code = `random(${argument0}, ${argument1} + 1)`;
    return [code, Blockly.C.ORDER_FUNCTION_CALL];
};

// --- NEW --- Generators for map, min, max
Blockly.C['math_map'] = function(block) {
    const value = Blockly.C.valueToCode(block, 'VALUE', Blockly.C.ORDER_COMMA) || '0';
    const fromLow = Blockly.C.valueToCode(block, 'FROMLOW', Blockly.C.ORDER_COMMA) || '0';
    const fromHigh = Blockly.C.valueToCode(block, 'FROMHIGH', Blockly.C.ORDER_COMMA) || '0';
    const toLow = Blockly.C.valueToCode(block, 'TOLOW', Blockly.C.ORDER_COMMA) || '0';
    const toHigh = Blockly.C.valueToCode(block, 'TOHIGH', Blockly.C.ORDER_COMMA) || '0';
    const code = `map(${value}, ${fromLow}, ${fromHigh}, ${toLow}, ${toHigh})`;
    return [code, Blockly.C.ORDER_FUNCTION_CALL];
};

Blockly.C['math_min'] = function(block) {
    const argument0 = Blockly.C.valueToCode(block, 'A', Blockly.C.ORDER_COMMA) || '0';
    const argument1 = Blockly.C.valueToCode(block, 'B', Blockly.C.ORDER_COMMA) || '0';
    const code = `min(${argument0}, ${argument1})`;
    return [code, Blockly.C.ORDER_FUNCTION_CALL];
};

Blockly.C['math_max'] = function(block) {
    const argument0 = Blockly.C.valueToCode(block, 'A', Blockly.C.ORDER_COMMA) || '0';
    const argument1 = Blockly.C.valueToCode(block, 'B', Blockly.C.ORDER_COMMA) || '0';
    const code = `max(${argument0}, ${argument1})`;
    return [code, Blockly.C.ORDER_FUNCTION_CALL];
};


// Override default logic_compare
Blockly.C['logic_compare'] = function(block) {
    const OPERATORS = {
        'EQ': '==',
        'NEQ': '!=',
        'LT': '<',
        'LTE': '<=',
        'GT': '>',
        'GTE': '>='
    };
    const operator = OPERATORS[block.getFieldValue('OP')];
    const argument0 = Blockly.C.valueToCode(block, 'A', Blockly.C.ORDER_RELATIONAL) || '0';
    const argument1 = Blockly.C.valueToCode(block, 'B', Blockly.C.ORDER_RELATIONAL) || '0';
    const code = argument0 + ' ' + operator + ' ' + argument1;
    console.log(`Generated logic_compare: ${code}`); // Debug log
    return [code, Blockly.C.ORDER_RELATIONAL];
};

// Override default logic_operation
Blockly.C['logic_operation'] = function(block) {
    const operator = (block.getFieldValue('OP') == 'AND') ? '&&' : '||';
    const order = (operator == '&&') ? Blockly.C.ORDER_LOGICAL_AND :
        Blockly.C.ORDER_LOGICAL_OR;
    const argument0 = Blockly.C.valueToCode(block, 'A', order);
    const argument1 = Blockly.C.valueToCode(block, 'B', order);
    if (!argument0 && !argument1) {
        // If there are no arguments, then the return code is false.
        return ['false', Blockly.C.ORDER_LOGICAL_OR];
    }
    if (!argument0) {
        return [argument1, order];
    }
    if (!argument1) {
        return [argument0, order];
    }
    const code = argument0 + ' ' + operator + ' ' + argument1;
    console.log(`Generated logic_operation: ${code}`); // Debug log
    return [code, order];
};

// Override default logic_boolean
Blockly.C['logic_boolean'] = function(block) {
    const code = (block.getFieldValue('BOOL') == 'TRUE') ? 'true' : 'false';
    console.log(`Generated logic_boolean: ${code}`); // Debug log
    return [code, Blockly.C.ORDER_ATOMIC];
};

// Override default logic_negate
Blockly.C['logic_negate'] = function(block) {
    const order = Blockly.C.ORDER_UNARY_PREFIX;
    const argument0 = Blockly.C.valueToCode(block, 'BOOL', order) ||
        'true';
    const code = '!' + argument0;
    console.log(`Generated logic_negate: ${code}`); // Debug log
    return [code, order];
};

// Override default math_number
Blockly.C['math_number'] = function(block) {
    const code = Number(block.getFieldValue('NUM'));
    console.log(`Generated math_number: ${code}`); // Debug log
    return [code, Blockly.C.ORDER_ATOMIC];
};

// Override default math_arithmetic
Blockly.C['math_arithmetic'] = function(block) {
    const OPERATORS = {
        'ADD': [' + ', Blockly.C.ORDER_ADDITIVE],
        'MINUS': [' - ', Blockly.C.ORDER_ADDITIVE],
        'MULTIPLY': [' * ', Blockly.C.ORDER_MULTIPLICATIVE],
        'DIVIDE': [' / ', Blockly.C.ORDER_MULTIPLICATIVE],
        'POWER': [null, Blockly.C.ORDER_NONE] // No direct power operator in C
    };
    const tuple = OPERATORS[block.getFieldValue('OP')];
    const operator = tuple[0];
    const order = tuple[1];
    const argument0 = Blockly.C.valueToCode(block, 'A', order) || '0';
    const argument1 = Blockly.C.valueToCode(block, 'B', order) || '0';
    let code;
    if (operator) {
        code = argument0 + operator + argument1;
    } else { // power
        code = 'pow(' + argument0 + ', ' + argument1 + ')';
        Blockly.C.definitions_['define_math'] = '#include <math.h>';
    }
    console.log(`Generated math_arithmetic: ${code}`); // Debug log
    return [code, order];
};


// --- Blockly Initialization ---
function initBlockly() {
    // Robustness check: Ensure Blockly and its XML utility are available
    if (typeof Blockly === 'undefined' || typeof Blockly.Xml === 'undefined' || typeof Blockly.Xml.textToDom !== 'function') {
        console.error("Blockly or Blockly.Xml.textToDom is not available. Please check Blockly script loading.");
        console.error("Error: Blockly library failed to load correctly. Block editor may not function. Please try reloading the page.");
        return; // Exit initBlockly if Blockly is not ready
    }

    const blocklyDiv = document.getElementById('blocklyDiv');
    const toolbox = document.getElementById('toolbox');
    
    // --- FIX: Custom Prompt for Variables ---
    const variablePromptOverlay = document.getElementById('variablePromptOverlay');
    const variablePromptBox = document.getElementById('variablePromptBox');
    const variableNameInput = document.getElementById('variableNameInput');
    const variablePromptOkBtn = document.getElementById('variablePromptOkBtn');
    const variablePromptCancelBtn = document.getElementById('variablePromptCancelBtn');

    Blockly.dialog.setPrompt(function(message, defaultValue, callback) {
        playClickSound();
        // PROPOSED ADDITION: Explicitly set the translated label text
        document.getElementById('variablePromptText').textContent = translations[currentLanguage]['variablePromptTitle'];
        variablePromptBox.style.display = 'flex'; // PROPOSED CHANGE: 'block' to 'flex' to fix centering
        variablePromptOverlay.style.display = 'block';
        variableNameInput.value = defaultValue;
        variableNameInput.focus();

        const okListener = () => {
            playClickSound();
            cleanup();
            callback(variableNameInput.value);
        };

        const cancelListener = () => {
            playClickSound();
            cleanup();
            callback(null);
        };
        
        const cleanup = () => {
            variablePromptBox.style.display = 'none';
            variablePromptOverlay.style.display = 'none';
            variablePromptOkBtn.removeEventListener('click', okListener);
            variablePromptCancelBtn.removeEventListener('click', cancelListener);
        };

        variablePromptOkBtn.addEventListener('click', okListener);
        variablePromptCancelBtn.addEventListener('click', cancelListener);
    });
    // --- END FIX ---


    workspace = Blockly.inject(blocklyDiv, {
        toolbox: toolbox,
        scrollbars: true,
        trashcan: true,
        horizontalLayout: false, // Vertical toolbox
        toolboxPosition: 'start', // Toolbox on the left
        zoom: {
            controls: true,
            wheel: true,
            startScale: 0.9,
            maxScale: 3,
            minScale: 0.3,
            scaleSpeed: 1.2
        },
        media: 'lib/media/' // Path to Blockly media assets
    });

    // --- NEW: Add click sound to Blockly toolbox categories ---
    const blocklyContainer = document.getElementById('blocklyDiv');
    blocklyContainer.addEventListener('click', (event) => {
        // Use .closest() to see if the click happened on or inside a toolbox category row
        if (event.target.closest('.blocklyTreeRow')) {
            playClickSound();
        }
    });

    // Add an event listener to the workspace to generate code on change
    workspace.addChangeListener(function(event) {
        // Update code for block changes
        if (event.type === Blockly.Events.BLOCK_CREATE || event.type === Blockly.Events.BLOCK_CHANGE ||
            event.type === Blockly.Events.BLOCK_DELETE || event.type === Blockly.Events.BLOCK_MOVE) {
            updateCodeFromBlockly();
        }

        // Specifically address the scrollbar issue when the toolbox flyout closes
        // The 'flyoutOpen' UI event indicates the flyout's visibility state change.
        if (event.type === Blockly.Events.UI && event.element === 'flyoutOpen') {
            if (event.newValue === false) { // Flyout is closing
                // Also resize Blockly workspace if it's visible to ensure correct rendering
                setTimeout(() => {
                    Blockly.svgResize(workspace);
                    console.log("Blockly workspace resized after flyout close.");
                }, 100);
            }
        }
    });

    // Default blocks are loaded by loadIndexedDB now, only if nothing else is found.
    // No need to load default blocks here directly.
}

function updateCodeFromBlockly() {
    if (workspace) {
        const code = Blockly.C.workspaceToCode(workspace);
        codeEditorDiv.querySelector('code').textContent = code;
        Prism.highlightElement(codeEditorDiv.querySelector('code'));
        logToConsole('Code updated from Blocks.');
        debouncedSaveBlocklyXmlToIndexedDB(); // Trigger auto-save for blocks
    }
}

// Initial state and Theme application
stopCodeBtn.disabled = true; // Stop button disabled initially

// Set initial language, theme, and connectivity on load
document.addEventListener('DOMContentLoaded', async () => {
    // Load and apply theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        setTheme('dark'); // Default to dark theme if no preference saved
    }

    // Load and apply mute preference
    const savedMuteState = localStorage.getItem('isMuted') === 'true';
    setMuteState(savedMuteState);


    // --- Initialize language dropdown buttons with native names ---
    languageButtons.forEach(button => {
        const langCode = button.dataset.lang;
        if (translations[langCode] && translations[langCode].nativeName) {
            button.textContent = translations[langCode].nativeName;
        }
    });

    // **REFACTORED** Load and apply language preference, including for Blockly
    const savedLanguage = localStorage.getItem('language') || 'en';
    const savedLangButton = document.querySelector(`.language-dropdown button[data-lang="${savedLanguage}"]`);
    
    // Simulate a click on the saved language button to trigger the full language load logic
    // The 'true' flag prevents the click sound from playing on initial load.
    if (savedLangButton) {
        // Create a synthetic event object to pass to the handler
        const initialEvent = { currentTarget: savedLangButton };
        await selectLanguage(initialEvent, true);
    }


    // Load and apply connectivity preference
    const savedConnectivity = localStorage.getItem('connectivity');
    if (savedConnectivity) {
        // Find the button corresponding to the saved connectivity and simulate a click
        const savedConnButton = document.querySelector(`.connectivity-dropdown button[data-conn="${savedConnectivity}"]`);
        if (savedConnButton) {
            // Remove active class from all connectivity buttons
            connectivityButtons.forEach(btn => btn.classList.remove('active-conn'));
            // Add active class to the selected connectivity button
            savedConnButton.classList.add('active-conn');
            currentConnectivity = savedConnectivity; // Update global current connectivity
        }
    } else {
        // Set initial active connectivity (e.g., 'net' for Wi-Fi by default)
        const defaultConnButton = document.querySelector('.connectivity-dropdown button[data-conn="net"]');
        if (defaultConnButton) {
            defaultConnButton.classList.add('active-conn');
            currentConnectivity = 'net'; // Ensure global variable is set
        }
    }

    // Load and apply control mode preference
    const savedControlMode = localStorage.getItem('activeControlMode') || 'walk';
    setMode(savedControlMode);

    // Load and apply action button preference
    const savedAction = localStorage.getItem('activeAction');
    if (savedAction === 'avoid') {
        avoidBtn.classList.add('active-toggle');
    } else if (savedAction === 'follow') {
        followBtn.classList.add('active-toggle');
    }

    // Load and apply main tab preference
    const savedMainTab = localStorage.getItem('activeMainTab') || 'controlTabBtn';
    showTabContent(savedMainTab);
});