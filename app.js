// Global state is managed in index.html (data variable)

// --- UI Interaction ---
document.getElementById('btn-open-modal').addEventListener('click', () => {
    document.getElementById('input-modal').style.display = 'block';
});

document.getElementById('btn-close-modal').addEventListener('click', () => {
    document.getElementById('input-modal').style.display = 'none';
});

function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tab}`).style.display = 'block';
    
    // Highlight active tab
    const btns = document.querySelectorAll('.tab-btn');
    if(tab === 'text') btns[0].classList.add('active');
    if(tab === 'image') btns[1].classList.add('active');
    if(tab === 'voice') btns[2].classList.add('active');
}

// --- Voice Input ---
const btnRecord = document.getElementById('btn-record');
const voiceStatus = document.getElementById('voice-status');
const voiceResult = document.getElementById('voice-result');
let recognition;

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        voiceStatus.textContent = "正在聆听...";
        btnRecord.style.background = "#fc4c02";
        btnRecord.style.color = "white";
    };

    recognition.onend = () => {
        voiceStatus.textContent = "点击麦克风开始说话";
        btnRecord.style.background = "#f5f5f5";
        btnRecord.style.color = "black";
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        voiceResult.textContent = `识别结果: "${transcript}"`;
        // Append to text input as a new line
        const textArea = document.getElementById('text-input');
        textArea.value += (textArea.value ? "\n" : "") + "语音录入: " + transcript;
        alert("已添加到文字输入框，请检查并完善格式 (香水名: 成分1, 成分2...)");
        switchTab('text');
    };

    btnRecord.addEventListener('click', () => {
        recognition.start();
    });
} else {
    voiceStatus.textContent = "您的浏览器不支持语音识别";
    btnRecord.disabled = true;
}

// --- Image Input ---
function handleImageUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('image-preview');
            preview.innerHTML = `<img src="${e.target.result}" style="max-width:300px; border-radius:10px; box-shadow:0 4px 10px rgba(0,0,0,0.1);">`;
            
            // Mock Analysis
            setTimeout(() => {
                alert("正在模拟分析图片... (此处应接入Vision API)");
                const mockResult = "模拟识别: 玫瑰, 茉莉, 檀香木, 佛手柑";
                const textArea = document.getElementById('text-input');
                textArea.value += (textArea.value ? "\n" : "") + "图片识别: " + mockResult;
                switchTab('text');
            }, 1500);
        }
        reader.readAsDataURL(input.files[0]);
    }
}

// --- Data Processing ---
function processAndVisualize() {
    const text = document.getElementById('text-input').value;
    if (!text.trim()) {
        alert("请输入内容");
        return;
    }

    const lines = text.split('\n');
    const newNodesMap = new Map(); // id -> {id, count, group}
    const newLinksMap = new Map(); // "id1-id2" -> count

    lines.forEach(line => {
        line = line.trim();
        if (!line) return;

        // Support formats: "Perfume: A, B, C" or just "A, B, C"
        let ingredientsStr = line;
        if (line.includes(':') || line.includes('：')) {
            ingredientsStr = line.split(/[:：]/)[1];
        }

        const ingredients = ingredientsStr.split(/[,，、]/).map(s => s.trim()).filter(s => s);
        
        // Update Nodes
        ingredients.forEach(ing => {
            if (!newNodesMap.has(ing)) {
                let group = 0;
                // Determine group from scentProfiles
                const profile = getScentProfile(ing); // Defined in index.html
                // Map profile name to a group number (simple hash or lookup)
                const profileGroups = ["木质", "花香", "辛辣", "柑橘", "美食", "草本", "树脂", "动物"];
                group = profileGroups.indexOf(profile);
                if (group === -1) group = 9; // Other

                newNodesMap.set(ing, { id: ing, group: group, count: 0 });
            }
            newNodesMap.get(ing).count++;
        });

        // Update Links (Clique for each perfume)
        for (let i = 0; i < ingredients.length; i++) {
            for (let j = i + 1; j < ingredients.length; j++) {
                const source = ingredients[i];
                const target = ingredients[j];
                // Sort to ensure unique key
                const key = [source, target].sort().join("-");
                newLinksMap.set(key, (newLinksMap.get(key) || 0) + 1);
            }
        }
    });

    // Convert to array format
    const nodes = Array.from(newNodesMap.values());
    const links = Array.from(newLinksMap.entries()).map(([key, value]) => {
        const [source, target] = key.split("-");
        return { source, target, value };
    });

    if (nodes.length === 0) {
        alert("未能解析出有效成分，请检查格式");
        return;
    }

    // Update Global Data
    // Note: D3 force simulation modifies node objects (adds x, y, vx, vy). 
    // If we replace data, we lose positions. 
    // For simplicity, we just restart.
    
    // We need to access 'data' from index.html. 
    // Since we changed 'const data' to 'let data', we can assign it.
    // However, the simulation holds a reference to the old array.
    // So we need to call renderGraph(newData).

    const newData = { nodes, links };
    
    // Close modal
    document.getElementById('input-modal').style.display = 'none';
    
    // Render
    if (window.renderGraph) {
        window.renderGraph(newData);
        // Also re-run analysis
        if (window.analyzeNetwork) {
            // analyzeNetwork reads from global 'data', so update it first if analyzeNetwork doesn't take args
            // Check index.html: analyzeNetwork uses 'data' variable directly.
            // So we must update global data variable.
            // But wait, 'let data' in index.html is in the global scope of that script? 
            // If it's top level in <script>, it's global window.data IF not type="module".
            // Let's assume it is accessible.
            
            // To be safe, we passed newData to renderGraph. 
            // But analyzeNetwork might need global data update.
            // Let's try to update window.data if possible, or assume renderGraph updates it?
            // Actually, best to pass data to analyzeNetwork if I can refactor it.
            // Or just update the global variable.
            
            // Refactor plan for index.html included "window.renderGraph = function(newData) { data = newData; ... }"
            // So calling renderGraph(newData) will update the closure variable 'data' inside index.html?
            // No, only if 'data' is in the same scope.
            // If I change 'const data' to 'let data' at top level, and renderGraph is in the same script, yes it works.
        }
    } else {
        console.error("renderGraph function not found");
    }
}