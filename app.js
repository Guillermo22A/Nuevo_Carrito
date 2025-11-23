const { createApp } = Vue;

createApp({
    data() {
        return {
            apiUrl: 'https://memo.micarrirobot.cc', 
            unitId: 'Memo_Bot_1',
            speed: 180,
            isOnline: false,
            
            // --- VARIABLES RENOMBRADAS (Consistencia Total) ---
            navLogs: [],  // Antes moveLogs
            warnLogs: [], // Antes obsLogs
            
            missionName: '', missionSeq: '', savedMissions: [], selectedMissionId: 0,
            
            activeAlert: false, activeAlertVal: 0, lastAlertTime: 0
        }
    },
    mounted() { 
        this.loadLogs(); 
        this.loadMissions();
        setInterval(this.loadLogs, 2000); 
        setInterval(this.checkAlert, 500);
    },
    methods: {
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
                    
                    // --- FILTRADO CON NUEVOS NOMBRES ---
                    this.navLogs = logs.filter(l => l.category === 'NAV');
                    this.warnLogs = logs.filter(l => l.category === 'WARN');
                    
                    // Lógica de Alerta (Usando warnLogs)
                    if (this.warnLogs.length > 0) {
                        const last = this.warnLogs[0];
                        // Fix UTC
                        let t = last.recorded_at; if(!t.endsWith('Z')) t += 'Z';
                        this.lastAlertTime = new Date(t).getTime();
                        this.activeAlertVal = last.metric_value;
                    }
                } else { this.isOnline = false; }
            } catch(e) { this.isOnline = false; }
        },

        checkAlert() {
            // Alerta visible solo por 3.5 segundos después del último reporte
            if ((Date.now() - this.lastAlertTime) < 3500) this.activeAlert = true;
            else this.activeAlert = false;
        },
        
        async loadMissions() {
            try {
                const res = await fetch(`${this.apiUrl}/mission/list`);
                if(res.ok) this.savedMissions = await res.json();
            } catch(e) {}
        },

        async saveMission() {
            if(!this.missionName || !this.missionSeq) return alert("Completa campos");
            try {
                await fetch(`${this.apiUrl}/mission/create`, {
                    method: 'POST', headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({ title: this.missionName, steps: this.missionSeq })
                });
                this.loadMissions(); alert("Guardado");
                this.missionName = ''; this.missionSeq = '';
            } catch(e) { alert("Error"); }
        },

        async deleteMission() {
            if(this.selectedMissionId == 0) return;
            if(!confirm("¿Eliminar esta misión?")) return;
            
            try {
                await fetch(`${this.apiUrl}/mission/delete/${this.selectedMissionId}`, { method: 'DELETE' });
                alert("Misión Eliminada");
                this.selectedMissionId = 0;
                this.loadMissions();
            } catch(e) { alert("Error al eliminar"); }
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
        }
    }
}).mount('#app');