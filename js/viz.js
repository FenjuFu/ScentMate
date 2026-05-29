import { SCENT_TRANSLATIONS, DB } from './data.js';

export class ScentVisualization {
    constructor(app) {
        this.app = app;
    }

    renderCard() {
        if (typeof d3 === 'undefined') {
            document.getElementById('viz-container').innerHTML = '<div style="text-align:center;padding-top:50px;color:red;">Visualization Library (D3.js) failed to load.<br>Please check internet connection.</div>';
            return;
        }

        const data = this.app.processNetworkData();
        this.renderStats(data);

        const container = document.getElementById('viz-container');
        container.innerHTML = '';
        const width = container.clientWidth;
        const height = container.clientHeight;

        if (data.nodes.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding-top:100px; color:#999;">请先添加香水</div>';
            return;
        }

        const svg = d3.select("#viz-container").append("svg")
            .attr("width", width)
            .attr("height", height)
            .call(d3.zoom().on("zoom", (event) => {
                g.attr("transform", event.transform);
            }))
            .append("g");
            
        const g = svg.append("g");

        const maxCount = d3.max(data.nodes, d => d.count) || 1;
        const radiusScale = d3.scaleSqrt().domain([1, maxCount]).range([10, 40]);
        
        const maxLink = d3.max(data.links, d => d.value) || 1;
        const widthScale = d3.scaleLinear().domain([1, maxLink]).range([1, 5]);

        const brandPalette = [
            "#fc4c02", "#8c7b75", "#d4af37", "#a65e2e", "#5d4037", 
            "#78909c", "#8d6e63", "#bcaaa4", "#ffcc80", "#e0e0e0"
        ];
        const colorScale = d3.scaleOrdinal(brandPalette);

        const simulation = d3.forceSimulation(data.nodes)
            .force("link", d3.forceLink(data.links).id(d => d.id).distance(120))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide().radius(d => radiusScale(d.count) + 10));

        const link = g.append("g")
            .selectAll("line")
            .data(data.links)
            .join("line")
            .attr("stroke", "#ccc")
            .attr("stroke-opacity", 0.6)
            .attr("stroke-width", d => widthScale(d.value))
            .on("mouseover", (event, d) => {
                const tooltip = d3.select(".tooltip");
                tooltip.style("opacity", 1)
                       .html(`<strong>${d.source.id} & ${d.target.id}</strong><br/>共现 ${d.value} 次<br/>${this.generatePairingDesc(d.source.id, d.target.id)}`)
                       .style("left", (event.pageX + 10) + "px")
                       .style("top", (event.pageY - 10) + "px");
                d3.select(event.currentTarget).attr("stroke", "#fc4c02").attr("stroke-opacity", 1);
            })
            .on("mouseout", (event) => {
                d3.select(".tooltip").style("opacity", 0);
                d3.select(event.currentTarget).attr("stroke", "#ccc").attr("stroke-opacity", 0.6);
            });

        const node = g.append("g")
            .selectAll("g")
            .data(data.nodes)
            .join("g")
            .call(d3.drag()
                .on("start", (event, d) => {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    d.fx = d.x; d.fy = d.y;
                })
                .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
                .on("end", (event, d) => {
                    if (!event.active) simulation.alphaTarget(0);
                    d.fx = null; d.fy = null;
                }));

        node.append("circle")
            .attr("r", d => radiusScale(d.count))
            .attr("fill", d => colorScale(d.group))
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .style("cursor", "pointer")
            .on("mouseover", (event, d) => {
                const tooltip = d3.select(".tooltip");
                const desc = DB.descriptions[d.id] || "独特的香气成分。";
                const isEn = this.app.state.currentLang === 'en';
                const displayName = isEn ? (SCENT_TRANSLATIONS[d.id] || d.id) : d.id;
                const displayDesc = isEn ? "Unique scent ingredient." : desc; 
                
                tooltip.style("opacity", 1)
                       .html(`<strong>${displayName}</strong><br/>${displayDesc}<br/><span style='color:#666;font-size:12px'>${isEn ? 'Count' : '出现'} ${d.count} ${isEn ? '' : '次'}</span>`)
                       .style("left", (event.pageX + 10) + "px")
                       .style("top", (event.pageY - 10) + "px");
                d3.select(event.currentTarget).attr("stroke", "#fc4c02").attr("stroke-width", 3);
            })
            .on("mouseout", (event) => {
                d3.select(".tooltip").style("opacity", 0);
                d3.select(event.currentTarget).attr("stroke", "#fff").attr("stroke-width", 2);
            });

        node.append("text")
            .text(d => this.app.state.currentLang === 'en' ? (SCENT_TRANSLATIONS[d.id] || d.id) : d.id)
            .attr("dx", d => radiusScale(d.count) + 5)
            .attr("dy", ".35em")
            .style("font-size", "12px")
            .style("font-family", "Georgia, serif")
            .style("pointer-events", "none")
            .style("text-shadow", "1px 1px 0 #fff");

        simulation.on("tick", () => {
            link.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
            node.attr("transform", d => `translate(${d.x},${d.y})`);
        });
    }

    renderStats(data) {
        const t = this.app.getTranslation().card;
        const isEn = this.app.state.currentLang === 'en';
        const perfumeCount = this.app.getActiveCardPerfumes().length;
        
        const topScents = [...data.nodes].sort((a,b) => b.count - a.count).slice(0, 3);
        document.getElementById('stat-top-scents').innerHTML = topScents.map(n => 
            `<li><span>${isEn ? (SCENT_TRANSLATIONS[n.id] || n.id) : n.id}</span> <span class="stat-val">${n.count}</span></li>`
        ).join('');

        const topPairs = [...data.links].sort((a,b) => b.value - a.value).slice(0, 3);
        document.getElementById('stat-top-pairs').innerHTML = topPairs.map(l => {
            const s = l.source.id || l.source;
            const target = l.target.id || l.target;
            const sName = isEn ? (SCENT_TRANSLATIONS[s] || s) : s;
            const tName = isEn ? (SCENT_TRANSLATIONS[target] || target) : target;
            return `<li><span>${sName} & ${tName}</span> <span class="stat-val">${l.value}</span></li>`;
        }).join('');

        document.getElementById('stat-overview').innerHTML = `
            <li><span data-i18n="card.perfumes">${t.perfumes}</span> <span class="stat-val">${perfumeCount} ${t.bottles}</span></li>
            <li><span data-i18n="card.scents">${t.scents}</span> <span class="stat-val">${data.nodes.length} ${t.types}</span></li>
        `;

        this.generatePoeticContent(topScents);
    }

    generatePoeticContent(topScents) {
        const lang = this.app.state.currentLang;
        const t = this.app.getTranslation().card;
        const currentCard = this.app.getCurrentCardCollectionMeta();
        const profile = this.app.getActiveCardProfile();
        const ownerName = profile
            ? (profile.ownerName || profile.name)
            : (this.app.currentUser ? this.app.auth.displayName(this.app.currentUser) : '');
        const collectionName = profile ? profile.collectionName : currentCard?.name;
        const customTitle = currentCard?.cardTitle || '';
        const customQuote = currentCard?.cardQuote || '';
        
        if (topScents.length === 0) {
            const emptyTitle = customTitle || (collectionName
                ? (ownerName ? `${ownerName} · ${collectionName}` : collectionName)
                : (ownerName ? `${ownerName} · ${t.explorer}` : t.explorer));
            document.getElementById('card-user-title').textContent = emptyTitle;
            document.getElementById('card-poetic-quote').textContent = `“${customQuote || t.default_quote}”`;
            return;
        }
        
        const dominant = topScents[0].group;
        
        const titles = {
            zh: { "木质": "静谧森林的守望者", "花香": "繁花盛开的梦境", "柑橘": "阳光碎片的捕手", "辛辣": "异域香料的吟游诗人", "美食": "甜蜜时光的收藏家", "草本": "雨后原野的漫步者" },
            en: { "木质": "Guardian of the Silent Forest", "花香": "Dream of Blooming Flowers", "柑橘": "Catcher of Sunlight Fragments", "辛辣": "Bard of Exotic Spices", "美食": "Collector of Sweet Moments", "草本": "Wanderer of After-Rain Fields" }
        };
        
        const quotes = {
            zh: { "木质": "根植于大地，呼吸于云端，你的灵魂有树木的年轮。", "花香": "在此刻，万物皆为你绽放，空气中满是温柔的絮语。", "柑橘": "明亮如夏日清晨的第一缕光，驱散所有阴霾。", "辛辣": "热烈而深邃，如同古老集市中跳动的火焰。", "美食": "记忆是甜的，如同刚刚出炉的香草蛋糕，温暖而安宁。", "草本": "风吹过青草的痕迹，是你清澈而自由的心跳。" },
            en: { "木质": "Rooted in earth, breathing in clouds, your soul bears the rings of trees.", "花香": "In this moment, everything blooms for you, the air filled with gentle whispers.", "柑橘": "Bright as the first light of a summer morning, dispelling all haze.", "辛辣": "Passionate and profound, like a dancing flame in an ancient bazaar.", "美食": "Memory is sweet, like a freshly baked vanilla cake, warm and peaceful.", "草本": "The trace of wind over grass is your clear and free heartbeat." }
        };

        const poeticTitle = customTitle || titles[lang][dominant] || t.explorer;
        const title = ownerName ? `${ownerName} · ${poeticTitle}` : poeticTitle;
        const quote = customQuote || (quotes[lang][dominant] || t.default_quote);

        document.getElementById('card-user-title').textContent = title;
        document.getElementById('card-poetic-quote').textContent = `“${quote}”`;
    }

    generatePairingDesc(s, t) {
        const p1 = this.app.getProfile(s);
        const p2 = this.app.getProfile(t);
        const lang = this.app.state.currentLang;
        const pairKey = [p1, p2].sort().join("-");
        
        const combinations_zh = {
            "木质-花香": "深沉木质与柔美花香的经典平衡，刚柔并济，优雅而持久。",
            "柑橘-木质": "清新的柑橘照亮了沉稳的木质，带来如阳光穿透森林般的通透感。"
        };
        const combinations_en = {
            "木质-花香": "Classic balance of deep wood and soft florals, elegant and lasting.",
            "柑橘-木质": "Fresh citrus illuminates steady wood, like sunlight piercing through a forest."
        };

        const combinations = lang === 'zh' ? combinations_zh : combinations_en;
        if (combinations[pairKey]) return combinations[pairKey];
        
        const tObj = this.app.getTranslation().card;
        if (p1 === p2) return tObj.pairing_same ? tObj.pairing_same.replace('{0}', p1) : `两种${p1}调的深度共鸣。`;
        return tObj.pairing_mix ? tObj.pairing_mix.replace('{0}', p1).replace('{1}', p2) : `融合${p1}与${p2}的体验。`;
    }
}
