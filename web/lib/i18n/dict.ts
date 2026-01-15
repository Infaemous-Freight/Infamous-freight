export type Locale = "en" | "es";

export const dict = {
  en: {
    appName: "Infamous Freight",
    nav: {
      avatar: "Avatar Settings",
      genesis: "Genesis",
      ops: "Ops Dashboard",
    },
    common: {
      loading: "Loading...",
      error: "Error",
      send: "Send",
      upload: "Upload",
    },
    genesis: {
      title: "Genesis",
      subtitle: "AI operator for Infamous Freight Enterprises",
      placeholder: "Message Genesis...",
    },
    avatar: {
      title: "Avatar Settings",
      choose: "Choose a Main Avatar or upload a Personal Avatar.",
      selected: "Selected",
    },
    ops: {
      title: "Ops Dashboard",
      subtitle: "Satellite-style intelligence (weather + route risk)",
    },
  },
  es: {
    appName: "Infamous Freight",
    nav: {
      avatar: "Configuración de Avatar",
      genesis: "Génesis",
      ops: "Panel de Operaciones",
    },
    common: {
      loading: "Cargando...",
      error: "Error",
      send: "Enviar",
      upload: "Subir",
    },
    genesis: {
      title: "Génesis",
      subtitle: "Operador de IA para Infamous Freight Enterprises",
      placeholder: "Mensaje a Génesis...",
    },
    avatar: {
      title: "Configuración de Avatar",
      choose: "Elige un Avatar Principal o sube un Avatar Personal.",
      selected: "Seleccionado",
    },
    ops: {
      title: "Panel de Operaciones",
      subtitle: "Inteligencia tipo satélite (clima + riesgo de ruta)",
    },
  },
} as const;

export type Dict = typeof dict;
