import { SCENT_TRANSLATIONS, DB, PROFILE_COLORS } from './data.js';
import { buildFallbackIdentity, searchPerfumesByNoteCombination } from './ai-service.js';

export class ScentVisualization {
    constructor(app) {
        this.app = app;
        this.selectedNotes = new Set();
        this.selectionNodes = null;
        this.bindComboUiOnce();
    }

    bindComboUiOnce() {
        if (this._comboBound) return;
        this._comboBound = true;
        const clearBtn = document.getElementById('btn-viz-combo-clear');
        const searchBtn = document.getElementById('btn-viz-combo-search');
        const modal = document.getElementById('combo-modal');
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearSelection());
        if (searchBtn) searchBtn.addEventListener('click', () => this.runComboSearch());
        if (modal) modal.querySelector('.modal-close')?.addEventListener('click', () => modal.classList.remove('active'));
    }

    renderCard() {
        if (typeof d3 === 'undefined') {
            document.getElementById('viz-container').innerHTML = '<div style="text-align:center;padding-top:50px;color:red;">Visualization Library (D3.js) failed to load.<br>Please check internet connection.</div>';
            return;
        }

        const data = this.app.processNetworkData();
        this.renderStats(data);
        this.clearSelection();

        const container = document.getElementById('viz-container');
        const selectionBar = document.getElementById('viz-selection-bar');
        Array.from(container.children).forEach(child => {
            if (child.id !== 'viz-selection-bar') child.remove();
        });
        const width = container.clientWidth;
        const height = container.clientHeight;

        if (data.nodes.length === 0) {
            const empty = document.createElement('div');
            empty.style.cssText = 'text-align:center; padding-top:100px; color:#999;';
            empty.textContent = this.app.state.currentLang === 'en' ? 'Add a perfume first' : '请先添加香水';
            container.appendChild(empty);
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
            .style("cursor", "pointer")
            .on("mouseover", (event, d) => {
                const tooltip = d3.select(".tooltip");
                const sourceId = d.source.id || d.source;
                const targetId = d.target.id || d.target;
                const isEn = this.app.state.currentLang === 'en';
                const sourceDisplay = isEn ? (SCENT_TRANSLATIONS[sourceId] || sourceId) : sourceId;
                const targetDisplay = isEn ? (SCENT_TRANSLATIONS[targetId] || targetId) : targetId;
                const coOccurLabel = isEn ? `Co-occurs ${d.value} time${d.value === 1 ? '' : 's'}` : `共现 ${d.value} 次`;
                const perfumeList = this.findPerfumesWithBothNotes(sourceId, targetId);
                const perfumeBlock = perfumeList.length
                    ? `<div style="margin-top:6px;color:#555;"><span style="color:#999;">${isEn ? 'In your collection' : '来自你收藏夹'}：</span>${perfumeList.map(name => this.app.escapeHtml(name)).join('<span style="color:#bbb;"> · </span>')}</div>`
                    : '';
                tooltip.style("opacity", 1)
                       .html(`<strong>${this.app.escapeHtml(sourceDisplay)} & ${this.app.escapeHtml(targetDisplay)}</strong><br/>${coOccurLabel}<br/>${this.generatePairingDesc(sourceId, targetId)}${perfumeBlock}`)
                       .style("left", (event.pageX + 10) + "px")
                       .style("top", (event.pageY - 10) + "px");
                if (!this.isLinkSelected(d)) {
                    d3.select(event.currentTarget).attr("stroke", "#fc4c02").attr("stroke-opacity", 1);
                }
            })
            .on("mouseout", (event, d) => {
                d3.select(".tooltip").style("opacity", 0);
                this.applyLinkStyle(d3.select(event.currentTarget), d);
            })
            .on("click", (event, d) => {
                event.stopPropagation();
                const sourceId = d.source.id || d.source;
                const targetId = d.target.id || d.target;
                const bothSelected = this.selectedNotes.has(sourceId) && this.selectedNotes.has(targetId);
                if (bothSelected) {
                    this.selectedNotes.delete(sourceId);
                    this.selectedNotes.delete(targetId);
                } else {
                    this.selectedNotes.add(sourceId);
                    this.selectedNotes.add(targetId);
                }
                this.refreshSelectionVisuals();
                this.updateSelectionBar();
            });
        this.linkSelection = link;

        let dragStartPos = null;
        let didDrag = false;
        const node = g.append("g")
            .selectAll("g")
            .data(data.nodes)
            .join("g")
            .call(d3.drag()
                .on("start", (event, d) => {
                    dragStartPos = { x: event.x, y: event.y };
                    didDrag = false;
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    d.fx = d.x; d.fy = d.y;
                })
                .on("drag", (event, d) => {
                    const dx = event.x - (dragStartPos?.x || 0);
                    const dy = event.y - (dragStartPos?.y || 0);
                    if (Math.hypot(dx, dy) > 5) didDrag = true;
                    d.fx = event.x; d.fy = event.y;
                })
                .on("end", (event, d) => {
                    if (!event.active) simulation.alphaTarget(0);
                    d.fx = null; d.fy = null;
                    if (!didDrag) this.toggleNoteSelection(d.id);
                }));

        const circle = node.append("circle")
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
                if (!this.selectedNotes.has(d.id)) {
                    d3.select(event.currentTarget).attr("stroke", "#fc4c02").attr("stroke-width", 3);
                }
            })
            .on("mouseout", (event, d) => {
                d3.select(".tooltip").style("opacity", 0);
                this.applyCircleStyle(d3.select(event.currentTarget), d);
            });
        this.circleSelection = circle;

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
        const activePerfumes = this.app.getActiveCardPerfumes();
        const ownerName = profile
            ? (profile.ownerName || profile.name)
            : (this.app.currentUser ? this.app.auth.displayName(this.app.currentUser) : '');
        const collectionName = profile ? profile.collectionName : currentCard?.name;
        const customTitle = currentCard?.cardTitle || '';
        const customQuote = currentCard?.cardQuote || '';
        const fallbackIdentity = buildFallbackIdentity({
            name: collectionName || currentCard?.name || '',
            perfumes: activePerfumes
        }, lang);
        
        if (topScents.length === 0) {
            const emptyTitle = customTitle || (collectionName
                ? (ownerName ? `${ownerName} · ${collectionName}` : collectionName)
                : (ownerName ? `${ownerName} · ${t.explorer}` : t.explorer));
            document.getElementById('card-user-title').textContent = emptyTitle;
            document.getElementById('card-poetic-quote').textContent = `“${customQuote || t.default_quote}”`;
            this.renderMusicRecommendation(currentCard, fallbackIdentity);
            return;
        }
        
        const poeticTitle = customTitle || fallbackIdentity.cardTitle || t.explorer;
        const title = ownerName ? `${ownerName} · ${poeticTitle}` : poeticTitle;
        const quote = customQuote || fallbackIdentity.cardQuote || t.default_quote;

        document.getElementById('card-user-title').textContent = title;
        document.getElementById('card-poetic-quote').textContent = `“${quote}”`;
        this.renderMusicRecommendation(currentCard, fallbackIdentity);
    }

    renderMusicRecommendation(currentCard, fallbackIdentity) {
        const t = this.app.getTranslation().card;
        const musicTitle = currentCard?.musicTitle || fallbackIdentity.musicTitle || '';
        const musicComposer = currentCard?.musicComposer || fallbackIdentity.musicComposer || '';
        const musicReason = currentCard?.musicReason || fallbackIdentity.musicReason || '';
        const musicUrl = currentCard?.musicUrl || fallbackIdentity.musicUrl || '';
        const musicLinkLabel = currentCard?.musicLinkLabel || fallbackIdentity.musicLinkLabel || t.music_link;

        document.getElementById('card-music-title').textContent = musicTitle || t.music_fallback_title;
        document.getElementById('card-music-composer').textContent = musicComposer || '';
        document.getElementById('card-music-reason').textContent = musicReason || t.music_fallback_reason;

        const link = document.getElementById('card-music-link');
        const changeButton = document.getElementById('btn-card-change-music');
        if (changeButton) {
            changeButton.style.display = this.app.getActiveCardProfile() ? 'none' : 'inline-flex';
        }
        if (!link) return;
        if (musicUrl) {
            link.href = musicUrl;
            link.textContent = musicLinkLabel;
            link.style.display = 'inline-flex';
        } else {
            link.removeAttribute('href');
            link.textContent = '';
            link.style.display = 'none';
        }
    }

    toggleNoteSelection(noteId) {
        if (this.selectedNotes.has(noteId)) this.selectedNotes.delete(noteId);
        else this.selectedNotes.add(noteId);
        this.refreshSelectionVisuals();
        this.updateSelectionBar();
    }

    clearSelection() {
        this.selectedNotes.clear();
        this.refreshSelectionVisuals();
        this.updateSelectionBar();
    }

    isLinkSelected(d) {
        const s = d.source.id || d.source;
        const t = d.target.id || d.target;
        return this.selectedNotes.has(s) && this.selectedNotes.has(t);
    }

    applyCircleStyle(sel, d) {
        if (this.selectedNotes.has(d.id)) {
            sel.attr("stroke", "#fc4c02").attr("stroke-width", 4);
        } else {
            sel.attr("stroke", "#fff").attr("stroke-width", 2);
        }
    }

    applyLinkStyle(sel, d) {
        if (this.isLinkSelected(d)) {
            sel.attr("stroke", "#fc4c02").attr("stroke-opacity", 0.9);
        } else {
            sel.attr("stroke", "#ccc").attr("stroke-opacity", 0.6);
        }
    }

    refreshSelectionVisuals() {
        if (this.circleSelection) this.circleSelection.each((d, i, nodes) => this.applyCircleStyle(d3.select(nodes[i]), d));
        if (this.linkSelection) this.linkSelection.each((d, i, nodes) => this.applyLinkStyle(d3.select(nodes[i]), d));
    }

    updateSelectionBar() {
        const bar = document.getElementById('viz-selection-bar');
        const chipsHost = document.getElementById('viz-selection-chips');
        const searchBtn = document.getElementById('btn-viz-combo-search');
        if (!bar || !chipsHost) return;
        const isEn = this.app.state.currentLang === 'en';
        const notes = Array.from(this.selectedNotes);
        if (notes.length === 0) {
            bar.hidden = true;
            chipsHost.innerHTML = '';
            return;
        }
        bar.hidden = false;
        chipsHost.innerHTML = '';
        notes.forEach(n => {
            const chip = document.createElement('span');
            chip.className = 'viz-selection-chip';
            const profile = this.app.getProfile(n);
            const color = PROFILE_COLORS[profile] || PROFILE_COLORS['其他'];
            const dot = document.createElement('span');
            dot.className = 'viz-selection-chip-dot';
            dot.style.background = color;
            chip.appendChild(dot);
            chip.appendChild(document.createTextNode(isEn ? (SCENT_TRANSLATIONS[n] || n) : n));
            const remove = document.createElement('span');
            remove.className = 'viz-selection-chip-remove';
            remove.textContent = '×';
            remove.addEventListener('click', () => this.toggleNoteSelection(n));
            chip.appendChild(remove);
            chipsHost.appendChild(chip);
        });
        if (searchBtn) searchBtn.disabled = notes.length < 2;
    }

    async runComboSearch() {
        const notes = Array.from(this.selectedNotes);
        if (notes.length < 2) return;
        const t = this.app.getTranslation().card;
        const isEn = this.app.state.currentLang === 'en';
        const modal = document.getElementById('combo-modal');
        const body = document.getElementById('combo-modal-body');
        const subtitle = document.getElementById('combo-modal-subtitle');
        const searchBtn = document.getElementById('btn-viz-combo-search');
        if (!modal || !body) return;
        const displayNotes = notes.map(n => isEn ? (SCENT_TRANSLATIONS[n] || n) : n).join(' · ');
        subtitle.textContent = (t.combo_modal_subtitle || '').replace('{0}', displayNotes);
        body.innerHTML = `<div class="combo-modal-status">${t.combo_loading}</div>`;
        modal.classList.add('active');
        if (searchBtn) searchBtn.disabled = true;
        try {
            const results = await searchPerfumesByNoteCombination(notes, this.app.state.currentLang);
            if (!results.length) {
                body.innerHTML = `<div class="combo-modal-status">${t.combo_empty_result}</div>`;
                return;
            }
            body.innerHTML = results.map(item => `
                <div class="combo-suggestion">
                    <div class="combo-suggestion-name">${this.app.escapeHtml(item.name)}</div>
                    ${item.brand ? `<div class="combo-suggestion-brand">${this.app.escapeHtml(item.brand)}</div>` : ''}
                    ${item.reason ? `<div class="combo-suggestion-reason">${this.app.escapeHtml(item.reason)}</div>` : ''}
                </div>
            `).join('');
        } catch (error) {
            body.innerHTML = `<div class="combo-modal-status">${t.combo_error}</div>`;
        } finally {
            if (searchBtn) searchBtn.disabled = notes.length < 2;
        }
    }

    findPerfumesWithBothNotes(noteA, noteB) {
        const perfumes = this.app.getActiveCardPerfumes();
        const matches = [];
        for (const p of perfumes) {
            const all = new Set([...p.notes.top, ...p.notes.middle, ...p.notes.base]);
            if (all.has(noteA) && all.has(noteB)) matches.push(p.name);
            if (matches.length >= 6) break;
        }
        return matches;
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
