async function check() {
    try {
        const res = await fetch('https://ai-kirie-studio-app.netlify.app/.netlify/functions/api/health');
        const data = await res.json();
        console.log("Version:", data.version);
    } catch (e) {
        console.log("Error:", e.message);
    }
}
check();