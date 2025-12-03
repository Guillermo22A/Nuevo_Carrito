const { createApp } = Vue;

createApp({
    data() {
        return {
            apiUrl: 'https://memo.micarrirobot.cc',
            unitId: 'Memo_Bot_1',
            navLogs: [], warnLogs: [], lastMove: null 
        }
    },
    mounted() { this.loadData(); setInterval(this.loadData, 2000); },
    methods: {
        async loadData() {
            try {
                const res = await fetch(`${this.apiUrl}/ctrl/logs?unit_id=${this.unitId}`);
                if (res.ok) {
                    const all = await res.json();
                    // LIMITAR A 5
                    this.navLogs = all.filter(l => l.category === 'NAV').slice(0, 5);
                    this.warnLogs = all.filter(l => l.category === 'WARN').slice(0, 5);
                    
                    if (this.navLogs.length > 0) this.lastMove = this.navLogs[0];
                }
            } catch (e) {}
        },
        formatTime(d) {
            if (!d) return '-';
            let t = d; if (!t.endsWith("Z")) t += "Z";
            return new Date(t).toLocaleTimeString('es-ES');
        },
        mapAction(code) {
            const dic = {'F':'AVANCE', 'B':'RETROCESO', 'L':'GIRO IZQ', 'R':'GIRO DER', 'X':'STOP', 'Q':'CURVA I', 'E':'CURVA D', 'Y':'360 I', 'U':'360 D'};
            return dic[code] || code;
        }
    }
}).mount('#app');
