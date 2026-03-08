import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                translation: {
                    "lobby_title": "TIME'S UP",
                    "create_room": "Create Room",
                    "join_room": "Join Room",
                    "room_code": "Room Code",
                }
            },
            fr: {
                translation: {
                    "lobby_title": "TIME'S UP",
                    "create_room": "Créer une Salle",
                    "join_room": "Rejoindre une Salle",
                    "room_code": "Code de la Salle",
                }
            },
            es: {
                translation: {
                    "lobby_title": "TIME'S UP MX",
                    "create_room": "Crear Sala",
                    "join_room": "Unirse a la Sala",
                    "room_code": "Código de Sala",
                }
            }
        },
        lng: "fr",
        fallbackLng: "en",
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
