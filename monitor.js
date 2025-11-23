const { createApp } = Vue;

createApp({
    data() {
        return {
            apiUrl: 'https://memo.micarrirobot.cc',
            unitId: 'Memo_Bot_1',
            
            allLogs: [],
            navLogs: [],  // CORREGIDO: Antes se llamaba moveLogs
            warnLogs: [], // CORREGIDO: Antes se llamaba obsLogs
            lastMove: null 
        }
    },
    mounted() {
        this.loadData();
        // Actualizar automáticamente cada 2 segundos
        setInterval(this.loadData, 2000);
    },
    methods: {
        async loadData() {
            try {
                const res = await fetch(`${this.apiUrl}/ctrl/logs?unit_id=${this.unitId}`);
                if (res.ok) {
                    this.allLogs = await res.json();
                    
                    // 1. Separar Bitácora de Navegación (NAV)
                    // Usamos el nombre 'navLogs' que espera el HTML
                    this.navLogs = this.allLogs.filter(l => l.category === 'NAV');
                    
                    // 2. Separar Registro de Alertas (WARN)
                    // Usamos el nombre 'warnLogs' que espera el HTML
                    this.warnLogs = this.allLogs.filter(l => l.category === 'WARN');

                    // 3. Determinar Último Movimiento
                    if (this.navLogs.length > 0) {
                        this.lastMove = this.navLogs[0]; 
                    }
                }
            } catch (e) { console.error("Error conectando:", e); }
        },

        formatTime(d) {
            if (!d) return '-';
            let timeString = d;
            if (!timeString.endsWith("Z")) timeString += "Z";
            return new Date(timeString).toLocaleTimeString('es-ES');
        },

        mapAction(code) {
            const dic = {
                'F': 'AVANCE', 'B': 'RETROCESO', 'L': 'GIRO IZQ', 
                'R': 'GIRO DER', 'X': 'DETENIDO', 'S': 'STOP',
                'Q': 'CURVA IZQ', 'E': 'CURVA DER'
            };
            return dic[code] || code;
        }
    }
}).mount('#app');