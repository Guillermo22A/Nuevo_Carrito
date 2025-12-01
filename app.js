const { createApp } = Vue;

createApp({
    data() {
        return {
            apiUrl: 'https://memo.micarrirobot.cc', 
            unitId: 'Memo_Bot_1',
            speed: 180,
            isOnline: false,
            
            navLogs: [], warnLogs: [],
            
            // --- VARIABLES DE MISIÓN (VISUAL) ---
            missionName: '',
            visualSteps: [], // Array de objetos: { cmd: 'F', time: 1000 }
            newStepCmd: 'F', // Valor por defecto del selector
            newStepTime: 1000, // Tiempo por defecto
            
            savedMissions: [], selectedMissionId: 0,
            
            activeAlert: false, activeAlertVal: 0, lastAlertTime: 0
        }
    },
    mounted() { 
        this.loadLogs(); this.loadMissions();
        setInterval(this.loadLogs, 2000); 
        setInterval(this.checkAlert, 500);
    },
    methods: {
        // --- CONSTRUCTOR VISUAL DE MISIONES ---
        addStep() {
            if (this.newStepTime < 100) return alert("Tiempo mínimo 100ms");
            
            // Agregar al array visual
            this.visualSteps.push({
                cmd: this.newStepCmd,
                time: this.newStepTime
            });
        },
        
        removeStep(index) {
            this.visualSteps.splice(index, 1);
        },

        async saveMission() {
            if(!this.missionName) return alert("Escribe un nombre para la misión");
            if(this.visualSteps.length === 0) return alert("Agrega al menos un paso");
            
            // 1. CONVERTIR ARRAY VISUAL A FORMATO TEXTO (Compilación)
            // De [{cmd:'F', time:1000}, {cmd:'R', time:500}] 
            // a "F:1000|R:500"
            const sequenceString = this.visualSteps
                .map(s => `${s.cmd}:${s.time}`)
                .join('|');
            
            try {
                await fetch(`${this.apiUrl}/mission/create`, {
                    method: 'POST', headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({ 
                        title: this.missionName, 
                        steps: sequenceString 
                    })
                });
                
                this.loadMissions(); 
                alert("¡Misión Guardada!");
                
                // Resetear el constructor
                this.missionName = '';
                this.visualSteps = [];
                this.newStepCmd = 'F';
                this.newStepTime = 1000;
                
            } catch(e) { alert("Error al guardar"); }
        },

        // --- RESTO DE FUNCIONES (Igual que antes) ---
        
        async send(char) {
            try {
                await fetch(`${this.apiUrl}/ctrl/send`, {
                    method: 'POST', headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({ unit_id: this.unitId, cmd_char: char, val: this.speed })
                });
                setTimeout(this.loadLogs, 200);
            } catch(e) { console.error(e); }
        },
        
        async loadLogs() {
            try {
                const res = await fetch(`${this.apiUrl}/ctrl/logs?unit_id=${this.unitId}`);
                if(res.ok) {
                    this.isOnline = true;
                    const logs = await res.json();
                    this.navLogs = logs.filter(l => l.category === 'NAV');
                    this.warnLogs = logs.filter(l => l.category === 'WARN');
                    
                    if (this.warnLogs.length > 0) {
                        const last = this.warnLogs[0];
                        let t = last.recorded_at; if(!t.endsWith('Z')) t += 'Z';
                        this.lastAlertTime = new Date(t).getTime();
                        this.activeAlertVal = last.metric_value;
                    }
                } else { this.isOnline = false; }
            } catch(e) { this.isOnline = false; }
        },

        checkAlert() {
            if ((Date.now() - this.lastAlertTime) < 3500) this.activeAlert = true;
            else this.activeAlert = false;
        },
        
        async loadMissions() {
            try {
                const res = await fetch(`${this.apiUrl}/mission/list`);
                if(res.ok) this.savedMissions = await res.json();
            } catch(e) {}
        },

        async deleteMission() {
            if(this.selectedMissionId == 0) return;
            if(!confirm("¿Eliminar esta misión?")) return;
            try {
                await fetch(`${this.apiUrl}/mission/delete/${this.selectedMissionId}`, { method: 'DELETE' });
                alert("Eliminada");
                this.selectedMissionId = 0;
                this.loadMissions();
            } catch(e) { alert("Error"); }
        },
        
        async runSelected() {
            if(this.selectedMissionId == 0) return;
            await fetch(`${this.apiUrl}/mission/exec/${this.selectedMissionId}?unit_id=${this.unitId}`, {method:'POST'});
            alert("Ejecutando...");
        },

        formatTime(d) {
            if(!d) return '-';
            let t = d; if(!t.endsWith('Z')) t += 'Z';
            return new Date(t).toLocaleTimeString('es-ES');
        },

        mapAction(code) {
            const map = {
                'F': 'AVANCE', 'B': 'RETROCESO', 'X': 'PAUSA',
                'L': 'GIRO IZQ', 'R': 'GIRO DER',
                'Q': 'CURVA IZQ', 'E': 'CURVA DER',
                'Y': '360 IZQ', 'U': '360 DER'
            };
            return map[code] || code;
        }
    }
}).mount('#app');
