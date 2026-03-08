export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                glass: "rgba(255, 255, 255, 0.05)",
                glassBorder: "rgba(255, 255, 255, 0.1)",
            },
            animation: {
                'mesh-gradient': 'mesh 15s ease infinite',
                'pulse-fast': 'pulse 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                mesh: {
                    '0%, 100%': {
                        'background-position': '0% 50%',
                    },
                    '50%': {
                        'background-position': '100% 50%',
                    },
                }
            }
        },
    },
    plugins: [],
}
