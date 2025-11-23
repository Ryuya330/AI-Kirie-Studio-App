async function check() {
    try {
        const res = await fetch('https://ryuya-ai-chat.netlify.app/.netlify/functions/api/health');
        const data = await res.json();
        console.log("Version:", data.version);
    } catch (e) {
        console.log("Error:", e.message);
    }
}
check();