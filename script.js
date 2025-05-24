const apiKeyInput = document.getElementById('api-key');
const saveKeyButton = document.getElementById('save-key');
const personDescriptionInput = document.getElementById('person-description');
const sendDescriptionButton = document.getElementById('send-description');
const loadingIndicator = document.getElementById('loading');
const markdownOutputDiv = document.getElementById('markdown-output');
const toggleApiKeyButton = document.getElementById('toggle-api-key');
const apiKeySection = document.getElementById('api-key-section');
const rowsInput = document.getElementById('rows');
const colsInput = document.getElementById('cols');
const deskMatesInput = document.getElementById('desk-mates');
const generateTableButton = document.getElementById('generate-table');
// const copyTableButton = document.getElementById('copy-table'); // Button removed
const tablePreviewDiv = document.getElementById('table-preview');
const modelConfigsListDiv = document.getElementById('model-configs-list');
const addModelConfigButton = document.getElementById('add-model-config');
const openSettingsButton = document.getElementById('open-settings-button');
const settingsSidebar = document.getElementById('settings-sidebar');
const closeSidebarButton = settingsSidebar.querySelector('.close-button');
const clearPersonnelTableButton = document.getElementById('clear-personnel-table');
const importPersonnelMarkdownTextarea = document.getElementById('import-personnel-markdown');
const importPersonnelButton = document.getElementById('import-personnel-button');
const copyArrangedTableButton = document.getElementById('copy-arranged-table');
const deepseekApiKeyInput = document.getElementById('deepseek-api-key');
const quickConfigDeepseekButton = document.getElementById('quick-config-deepseek');
const activeConfigDisplayDiv = document.getElementById('active-config-display');
const activeConfigStrongElement = activeConfigDisplayDiv ? activeConfigDisplayDiv.querySelector('strong') : null;
const copyPersonnelInfoButton = document.getElementById('copy-personnel-info');
const importSeatTableMarkdownTextarea = document.getElementById('import-seat-table-markdown');
const importSeatTableButton = document.getElementById('import-seat-table-button');

// Seat Modification UI Elements
const seatModificationSection = document.getElementById('seat-modification-section');
const seatModificationInput = document.getElementById('seat-modification-input');
const sendSeatModificationButton = document.getElementById('send-seat-modification-button');
const seatModificationLoading = document.getElementById('seat-modification-loading');
const seatModificationOutput = document.getElementById('seat-modification-output');

let seatModificationConversationHistory = []; // Separate history for seat modification
let conversationHistory = [];
let personnelData = JSON.parse(localStorage.getItem('personnel_data') || '[]');
let currentActiveConfigId = localStorage.getItem('current_active_config_id') || null;

// 页面加载时显示已保存的人员信息表（从数据数组生成）
if (personnelData.length > 0) {
    markdownOutputDiv.innerHTML = marked.parse(personnelDataToMarkdown(personnelData));
}

// 模型配置数组，支持多BaseURL，每个BaseURL下多Model，每个Model多Type
let modelConfigs = JSON.parse(localStorage.getItem('model_configs') || '[]');

// 初始化时为旧数据结构添加ID（如果需要兼容旧数据）
// 为了简化，这里选择如果检测到旧数据结构则清空。
if (modelConfigs.length > 0 && !modelConfigs[0].id) {
    console.warn("检测到旧版本模型配置数据，将清空。请重新添加模型配置。");
    modelConfigs = []; 
    saveModelConfigs(); // 清空后立即保存
}

// 函数：保存模型配置到 localStorage
function saveModelConfigs() {
    localStorage.setItem('model_configs', JSON.stringify(modelConfigs));
}

// 函数：保存当前活动配置ID到 localStorage
function saveActiveConfigId() {
    if (currentActiveConfigId) {
        localStorage.setItem('current_active_config_id', currentActiveConfigId);
    } else {
        localStorage.removeItem('current_active_config_id');
    }
}

// 函数：更新侧边栏中正在使用的配置显示
function updateActiveConfigDisplay(config) {
    if (activeConfigDisplayDiv && activeConfigStrongElement) {
        if (config && config.name) {
            activeConfigStrongElement.textContent = `${config.name} (模型: ${config.modelName || config.modelId})`;
            activeConfigDisplayDiv.style.display = 'block';
        } else if (config && config.baseURL) { // Fallback if name is not set but baseURL exists
            activeConfigStrongElement.textContent = `基于 ${config.baseURL.split('//')[1]?.split('/')[0] || '未知来源'} (模型: ${config.modelName || config.modelId})`;
            activeConfigDisplayDiv.style.display = 'block';
        } else {
            activeConfigStrongElement.textContent = '未指定或无效';
            activeConfigDisplayDiv.style.display = 'block'; // Keep it visible to show "未指定"
        }
    }
}

// 函数：根据类型获取模型配置
function getModelConfig(type) {
    let configToUse = null;
    if (currentActiveConfigId) {
        configToUse = modelConfigs.find(c => c.id === currentActiveConfigId);
    }

    if (configToUse) {
        for (const model of configToUse.models || []) {
            if (model.types.includes(type)) {
                const activeCfg = { ...configToUse, modelId: model.id, modelName: model.name };
                updateActiveConfigDisplay(activeCfg);
                return activeCfg;
            }
        }
        // Active config doesn't have the required model type, fall through to search all
    }

    // Fallback: find the first config that has the model type
    for (const config of modelConfigs) {
        for (const model of config.models || []) {
            if (model.types.includes(type)) {
                const activeCfg = { ...config, modelId: model.id, modelName: model.name };
                updateActiveConfigDisplay(activeCfg);
                // Optionally set this as active if no active one was found before for this type
                // if (!currentActiveConfigId) {
                //     currentActiveConfigId = config.id;
                //     saveActiveConfigId();
                // }
                return activeCfg;
            }
        }
    }

    updateActiveConfigDisplay(null); // No suitable config found
    return null;
}

// 函数：渲染模型配置列表
function renderModelConfigs() {
    modelConfigsListDiv.innerHTML = ''; // 清空现有列表
    modelConfigs.forEach((config, index) => {
        const isActive = config.id === currentActiveConfigId;
        const isCollapsed = config.isCollapsed === undefined ? false : config.isCollapsed; // Default to not collapsed

        const configItem = document.createElement('div');
        configItem.classList.add('model-config-item');
        if (isActive) {
            configItem.classList.add('active-config');
        }
        if (isCollapsed) {
            configItem.classList.add('collapsed');
        }
        configItem.dataset.configId = config.id;

        configItem.innerHTML = `
            <div class="config-item-header" data-index="${index}">
                <h3>
                    <span class="collapse-icon">${isCollapsed ? '▶' : '▼'}</span>
                    配置 #${index + 1} ${config.name ? `(${config.name})` : ''} ${isActive ? '<span class="active-indicator">(当前使用)</span>' : ''}
                </h3>
            </div>
            <div class="config-item-content">
                <label>名称:</label>
                <input type="text" class="config-name" placeholder="配置名称 (可选)" value="${config.name || ''}" data-index="${index}">
                <label>Base URL:</label>
            <input type="text" class="config-baseurl" placeholder="Base URL" value="${config.baseURL || ''}" data-index="${index}">
            <label>API Key:</label>
                <input type="password" class="config-apikey" placeholder="API Key" value="${config.apiKey || ''}" data-index="${index}">

                <div class="model-list-controls">
                    <h4>Models:</h4>
                    <button type="button" class="fetch-models" data-config-index="${index}">从API获取Models</button>
                </div>
                
                <div class="models-list" data-config-index="${index}">
                    ${(config.models || []).map((model, modelIndex) => `
                        <div class="model-item">
                            <label>Model ${modelIndex + 1} ID:</label>
                            <input type="text" class="model-id" placeholder="Model ID" value="${model.id || ''}" data-config-index="${index}" data-model-index="${modelIndex}">
                            <label>Model ${modelIndex + 1} Name:</label>
                            <input type="text" class="model-name" placeholder="Model Name (Optional)" value="${model.name || ''}" data-config-index="${index}" data-model-index="${modelIndex}">
                            <label>Tasks:</label>
                            <select class="model-types" multiple data-config-index="${index}" data-model-index="${modelIndex}">
                                <option value="personnel" ${model.types && model.types.includes('personnel') ? 'selected' : ''}>人员整理</option>
                                <option value="seating" ${model.types && model.types.includes('seating') ? 'selected' : ''}>座位排布</option>
                                <option value="seat_modification" ${model.types && model.types.includes('seat_modification') ? 'selected' : ''}>座位修改</option>
                                <option value="other" ${model.types && model.types.includes('other') ? 'selected' : ''}>其他</option>
                            </select>
                            <button type="button" class="remove-model secondary-button" data-config-index="${index}" data-model-index="${modelIndex}">移除Model</button>
                        </div>
                    `).join('')}
                </div>
                <button type="button" class="add-model secondary-button" data-config-index="${index}">添加Model</button>
                <div class="config-actions">
                    <button type="button" class="set-active-config primary-button" data-index="${index}" ${isActive ? 'disabled' : ''}>${isActive ? '当前配置' : '设为当前'}</button>
                    <button type="button" class="remove-config danger-button" data-index="${index}">移除此配置</button>
                </div>
            </div>
         `;
        modelConfigsListDiv.appendChild(configItem);
    });
}

// 函数：添加新的模型配置
function addModelConfig() {
    const newConfig = { 
        id: Date.now().toString(), 
        name: '', 
        baseURL: '', 
        apiKey: '', 
        models: [{ id: '', name: '', types: ['other'] }],
        isCollapsed: false // New configs are expanded by default
    };
    modelConfigs.push(newConfig);
    // If no active config, make the new one active
    if (!currentActiveConfigId) {
        currentActiveConfigId = newConfig.id;
        saveActiveConfigId();
    }
    renderModelConfigs();
    saveModelConfigs();
}

// Event listeners
addModelConfigButton.addEventListener('click', addModelConfig);

// Event listeners for settings modal
openSettingsButton.addEventListener('click', () => {
    settingsSidebar.classList.add('open');
});

closeSidebarButton.addEventListener('click', () => {
    settingsSidebar.classList.remove('open');
});

// 点击模态框外部关闭
window.addEventListener('click', (event) => {
    // If click is outside the sidebar and not the open button, close the sidebar
    if (!settingsSidebar.contains(event.target) && event.target !== openSettingsButton && settingsSidebar.classList.contains('open')) {
        settingsSidebar.classList.remove('open');
    }
});

// Event listener for DeepSeek quick configuration
quickConfigDeepseekButton.addEventListener('click', () => {
    const apiKey = deepseekApiKeyInput.value.trim();
    if (!apiKey) {
        alert('请输入 DeepSeek API Key。');
        return;
    }

    // Create a new config item for DeepSeek
    const deepseekConfig = {
        id: Date.now().toString(), // Simple unique ID
        name: 'DeepSeek 配置',
        baseURL: 'https://api.deepseek.com',
        apiKey: apiKey,
        models: [
            { id: 'deepseek-chat', name: 'DeepSeek Chat', types: ['personnel', 'other'] }, // Personnel and other tasks
            { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', types: ['seating', 'other'] } // Seating and other tasks
        ]
    };

    // Add the new config to the list
    modelConfigs.push(deepseekConfig);

    // Render and save the configs
    renderModelConfigs();
    saveModelConfigs();

    // Update active config display if this new config is relevant
    // For simplicity, we'll just try to get a config for 'personnel' to trigger an update.
    // A more robust solution would involve checking if the newly added config is now the "active" one.
    const newlyAddedConfig = modelConfigs.find(c => c.id === deepseekConfig.id);
    if (newlyAddedConfig && newlyAddedConfig.models.some(m => m.types.includes('personnel'))) {
        const personnelModel = getModelConfig('personnel'); // This will call updateActiveConfigDisplay
    } else if (newlyAddedConfig && newlyAddedConfig.models.some(m => m.types.includes('seating'))) {
        const seatingModel = getModelConfig('seating'); // This will call updateActiveConfigDisplay
    }


    alert('DeepSeek 模型配置已添加！请在下方列表中检查和确认。');
    // Optionally clear the quick config input after successful configuration
    deepseekApiKeyInput.value = '';
});

// Handle changes within the model configs list (using event delegation)
modelConfigsListDiv.addEventListener('change', (event) => {
    const target = event.target;
    // For config-level fields (name, baseURL, apiKey), use dataset.index
    const configIndex = target.dataset.index;
    // For model-level fields (id, name, types), use dataset.configIndex
    const modelConfigIndex = target.dataset.configIndex;
    const modelIndex = target.dataset.modelIndex; // Only relevant for model-level fields

    if (configIndex !== undefined) {
        // Handle config-level field change
        const config = modelConfigs[configIndex];
        if (config) {
            if (target.classList.contains('config-name')) {
                config.name = target.value;
            } else if (target.classList.contains('config-baseurl')) {
                config.baseURL = target.value;
            } else if (target.classList.contains('config-apikey')) {
                config.apiKey = target.value;
            }
        }
    } else if (modelConfigIndex !== undefined && modelIndex !== undefined) {
        // Handle model-level field change
        const config = modelConfigs[modelConfigIndex];
        if (config && config.models && config.models[modelIndex]) {
            const model = config.models[modelIndex];
            if (target.classList.contains('model-id')) {
                model.id = target.value;
            } else if (target.classList.contains('model-name')) {
                model.name = target.value;
            } else if (target.classList.contains('model-types')) {
                // Get selected options values
                const selectedTypes = Array.from(target.selectedOptions).map(option => option.value);
                model.types = selectedTypes;
            }
        }
    }

    // In any case where a relevant field changed, save configs
    // This check ensures we only save if one of the conditions above was met
    if (configIndex !== undefined || (modelConfigIndex !== undefined && modelIndex !== undefined)) {
        saveModelConfigs();
        // If the name of the active config changed, update the display
        if (modelConfigs[configIndex] && modelConfigs[configIndex].id === currentActiveConfigId) {
            getModelConfig('personnel'); // Re-evaluate active config for display
        }
    }
});

modelConfigsListDiv.addEventListener('click', (event) => {
    const target = event.target;
    const configItemElement = target.closest('.model-config-item');
    const configId = configItemElement ? configItemElement.dataset.configId : null;
    const configIndex = configId ? modelConfigs.findIndex(c => c.id === configId) : -1;


    if (target.closest('.config-item-header') && configIndex !== -1) {
        modelConfigs[configIndex].isCollapsed = !modelConfigs[configIndex].isCollapsed;
        saveModelConfigs(); // Save collapse state
        renderModelConfigs(); // Re-render to show change
    } else if (target.classList.contains('set-active-config')) {
        if (configIndex !== -1 && modelConfigs[configIndex].id !== currentActiveConfigId) {
            currentActiveConfigId = modelConfigs[configIndex].id;
            saveActiveConfigId();
            renderModelConfigs(); // Re-render to update active indicator
            // Attempt to update display based on a common type, or the first type of the new active config
            const firstType = modelConfigs[configIndex].models[0]?.types[0] || 'personnel';
            getModelConfig(firstType); 
        }
    } else if (target.classList.contains('remove-config')) {
        if (configIndex !== -1) {
            const removedConfigId = modelConfigs[configIndex].id;
            modelConfigs.splice(configIndex, 1);
            if (currentActiveConfigId === removedConfigId) {
                currentActiveConfigId = modelConfigs.length > 0 ? modelConfigs[0].id : null; // Set to first or null
                saveActiveConfigId();
            }
            renderModelConfigs();
            saveModelConfigs();
            getModelConfig('personnel'); // Update display
        }
    } else if (target.classList.contains('remove-model')) {
        const modelIndex = target.dataset.modelIndex;
        if (configIndex !== -1 && modelIndex !== undefined) {
            modelConfigs[configIndex].models.splice(modelIndex, 1);
            renderModelConfigs();
            saveModelConfigs();
        }
    } else if (target.classList.contains('add-model')) {
        if (configIndex !== -1) {
            modelConfigs[configIndex].models.push({ id: '', name: '', types: ['other'] });
            renderModelConfigs();
            saveModelConfigs();
        }
    }
});

// Event listener for fetching models from API
modelConfigsListDiv.addEventListener('click', async (event) => {
    const target = event.target;
    if (target.classList.contains('fetch-models')) {
        const configIndex = target.dataset.configIndex;
        if (configIndex === undefined) return;

        const config = modelConfigs[configIndex];
        if (!config.baseURL || !config.apiKey) {
            alert('请先填写 Base URL 和 API Key。');
            return;
        }

        target.disabled = true;
        target.textContent = '获取中...';

        try {
            const response = await fetch(`${config.baseURL}/v1/models`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`获取模型列表失败: ${response.status} ${response.statusText} - ${errorData.error?.message || '未知错误'}`);
            }

            const data = await response.json();
            const models = data.data; // 假设模型列表在 data 字段中

            if (models && Array.isArray(models)) {
                // 清空当前配置下的models，用获取到的列表填充
                modelConfigs[configIndex].models = models.map(model => ({
                    id: model.id,
                    name: model.id, // 暂时使用id作为名称
                    types: ['other'] // 默认设置为other类型
                }));
                renderModelConfigs();
                saveModelConfigs();
                alert(`成功获取 ${models.length} 个模型。`);
            } else {
                alert('从 API 获取的模型列表格式不正确。');
                console.error('从 API 获取的模型列表格式不正确:', data);
            }

        } catch (error) {
            console.error('获取模型列表时出错:', error);
            alert(`获取模型列表失败: ${error.message}`);
        } finally {
            target.disabled = false;
            target.textContent = '从API获取Models';
        }
    }
});

// 页面加载时渲染已保存的模型配置
renderModelConfigs();
// 页面加载时尝试更新一次活动配置显示
if (currentActiveConfigId) {
    const activeConfig = modelConfigs.find(c => c.id === currentActiveConfigId);
    if (activeConfig && activeConfig.models && activeConfig.models.length > 0) {
        // Try to find a model for 'personnel' or 'seating' in the active config to display
        let modelToDisplay = activeConfig.models.find(m => m.types.includes('personnel'));
        if (!modelToDisplay) {
            modelToDisplay = activeConfig.models.find(m => m.types.includes('seating'));
        }
        if (!modelToDisplay && activeConfig.models.length > 0) {
            modelToDisplay = activeConfig.models[0]; // Fallback to the first model
        }
        if (modelToDisplay) {
             updateActiveConfigDisplay({...activeConfig, modelId: modelToDisplay.id, modelName: modelToDisplay.name});
        } else {
            updateActiveConfigDisplay(activeConfig); // Display config name if no specific model found
        }
    } else if (activeConfig) {
        updateActiveConfigDisplay(activeConfig); // Config has no models
    } else {
         getModelConfig('personnel'); // Fallback if active ID is invalid or config removed
    }
} else if (modelConfigs.length > 0) {
    // If no active config ID, try to set the first one as active and display
    currentActiveConfigId = modelConfigs[0].id;
    saveActiveConfigId();
    renderModelConfigs(); // Re-render to show the new active one
    getModelConfig('personnel'); // Then update display
} else {
    updateActiveConfigDisplay(null); // No configs at all
}


// 发送描述给 AI
sendDescriptionButton.addEventListener('click', async () => {
    const description = personDescriptionInput.value.trim();

    const personnelModel = getModelConfig('personnel');

    if (!personnelModel || !personnelModel.baseURL || !personnelModel.modelId || !personnelModel.apiKey) {
        alert('请先配置并保存人员整理的模型信息（Base URL, Model ID, API Key），并在配置中指定任务类型为"人员整理"。');
        return;
    }

    if (!description) {
        alert('请输入人物描述。');
        return;
    }

    loadingIndicator.style.display = 'block';
    markdownOutputDiv.innerHTML = ''; // 清空旧输出
    sendDescriptionButton.disabled = true;

    // 构建系统提示词
    const systemPrompt = `
你的任务是根据用户提供的人物描述信息，更新人员信息，并只返回需要修改（新增、删除、修改）的人物信息。

当前完整人员信息表（供参考，不要直接输出）：
${personnelDataToMarkdown(personnelData)}

具体操作步骤如下：

- 仔细阅读用户提供的人物描述和当前人员信息表。
- 识别新增的人物、信息有变动的人物以及可能需要删除的人物（例如，描述中不再提及的人物，如果需要删除）。
- 只输出发生变化的人物信息，使用以下格式包裹在 <changes> 标签内：
  - 新增人物：在一行开头添加 [新增]，后跟该人物的完整 markdown 表格行（| 人物 | 性别 | 备注 |）。
  - 修改人物：在一行开头添加 [修改]，后跟该人物更新后的完整 markdown 表格行（| 人物 | 性别 | 备注 |）。
  - 删除人物：在一行开头添加 [删除]，后跟该人物的姓名。
- 如果多个人物有变化，每人一行。
- 如果没有任何变化，请在 <changes> 标签内输出"没有变化"。

**示例输出：**
<changes>
[新增]| 王五 | 男 | 新来的销售，非常积极 |
[修改]| 张三 | 男 | 性格开朗，现负责协调工作 |
[删除]李四
</changes>

请只输出 <changes> 标签内的内容，不要包含其他任何文字、解释或完整的表格。
`;

    // 如果是第一次交互，添加系统提示词
    if (conversationHistory.length === 0) {
        conversationHistory.push({ role: 'system', content: systemPrompt });
    }

// 添加用户的新描述
    const userMessage = { role: 'user', content: `<人物描述>
${description}
</人物描述>` };
    conversationHistory.push(userMessage);
    // 存储用户描述到本地存储
    let storedDescriptions = JSON.parse(localStorage.getItem('user_descriptions') || '[]');
    storedDescriptions.push(description);
    localStorage.setItem('user_descriptions', JSON.stringify(storedDescriptions));

    try {
        // 使用fetch API直接调用DeepSeek API，确保在前端处理CORS
        const response = await fetch(`${personnelModel.baseURL}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${personnelModel.apiKey}`
            },
            body: JSON.stringify({
                model: personnelModel.modelId,
                messages: conversationHistory,
                stream: true,
                temperature: 0.35
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API 请求失败: ${response.status} ${response.statusText} - ${errorData.error?.message || '未知错误'}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulatedContent = '';
        let fullResponse = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonData = line.substring(6).trim();
                    if (jsonData === '[DONE]') {
                        break;
                    }
                    try {
                        const parsedData = JSON.parse(jsonData);
                        const delta = parsedData.choices[0]?.delta?.content;
                        if (delta) {
                            accumulatedContent += delta;
                            fullResponse += delta; // 记录完整响应用于下次对话
                            // 实时显示AI原始输出文本
                            // 最终的渲染会由 renderPersonnelTable 完成
                            // 为了避免解析不完整的markdown，这里直接显示文本
                            // 如果 markdownOutputDiv.textContent = accumulatedContent; 会有性能问题
                            // 我们可以考虑一个专门的区域显示原始输出，或者更聪明地处理流式渲染
                            // 暂时改回 innerHTML + marked.parse，但要确保最终renderPersonnelTable能正确覆盖
                            // 可能的问题在于 accumulatedContent 在流结束前不是一个完整的markdown表格，marked.parse可能会出问题
                            // 尝试直接设置 textContent 来显示原始文本
                            markdownOutputDiv.textContent = accumulatedContent;
                        }
                    } catch (e) {
                        console.error('解析 SSE 数据块时出错:', e, '数据块:', jsonData);
                    }
                }
            }
        }

        // 流结束后，确保最终的 Markdown 被渲染
        const changesMatch = accumulatedContent.match(/<changes>([\s\S]*?)<\/changes>/i);
        if (changesMatch && changesMatch[1]) {
            const changesContent = changesMatch[1].trim();
            if (changesContent && changesContent !== '没有变化') {
                updatePersonnelTable(changesContent);
            } else if (changesContent === '没有变化') {
                console.log('AI 表示没有需要更新的人员信息。');
            } else {
                console.warn('AI 返回的变化信息为空:', accumulatedContent);
            }
            // 将 AI 的完整响应（包括标签）添加到历史记录中，无论是否有变化
            conversationHistory.push({ role: 'assistant', content: accumulatedContent });
        } else {
            // 如果最终没有有效的变化输出（没有<changes>标签）
            // 检查是否是AI明确表示没有修改的情况（作为备用）
            if (accumulatedContent.includes('没有变化') || accumulatedContent.includes('无需更新')) {
                console.log('AI 表示没有需要更新的人员信息（未找到<changes>标签）。');
            } else {
                console.error('未能从 AI 响应中提取变化信息 (无<changes>标签): ', accumulatedContent);
            // 移除最后一次无效的用户输入和可能的系统提示（如果是第一次）
            conversationHistory.pop(); // 移除 user message
            if(conversationHistory.length > 0 && conversationHistory[conversationHistory.length-1].role === 'system') {
                conversationHistory.pop(); // 移除 system prompt if it was the only other message
            }
        }
            // 对于没有changes标签的情况，如果不是明确的"没有变化"，将原始输出作为助手的响应加入历史
            if (!(accumulatedContent.includes('没有变化') || accumulatedContent.includes('无需更新'))) {
                conversationHistory.push({ role: 'assistant', content: accumulatedContent });
            }
        }

        // 无论是否有变化，最后都重新渲染表格
        renderPersonnelTable();

    } catch (error) {
        console.error('调用 DeepSeek API 时出错:', error);
        markdownOutputDiv.innerHTML = `<p style="color: red;">发生错误: ${error.message}</p>`;
        // 出错时，也移除最后一次用户输入，避免影响下次请求
        conversationHistory.pop();
        if(conversationHistory.length > 0 && conversationHistory[conversationHistory.length-1].role === 'system') {
            conversationHistory.pop();
        }
    } finally {
        loadingIndicator.style.display = 'none';
        sendDescriptionButton.disabled = false;
        // Ensure final table is rendered even after errors
        // If an error occurred during streaming, accumulatedContent might be incomplete.
        // renderPersonnelTable uses the personnelData array, which is updated based on parsed changes.
        // If parsing failed, personnelData wouldn't be updated, and renderPersonnelTable would show the old data.
        // This is the desired behavior: show the last valid state or an empty table if cleared.
        // So calling it in finally is appropriate.
        renderPersonnelTable();
        // 不要清空输入框，保留用户输入
    }
});

// Event listener for clearing the personnel table
clearPersonnelTableButton.addEventListener('click', () => {
    // Clear the personnel data array
    personnelData = [];

    // Clear related items from localStorage
    localStorage.removeItem('personnel_data');
    localStorage.removeItem('user_descriptions'); // Also clear user descriptions

    // Clear the conversation history related to personnel management
    // This assumes the history is only for personnel management. If other features use it,
    // a more sophisticated clearing logic might be needed.
    conversationHistory = []; // Clear the history

    // Re-render the table (which will now be empty)
    renderPersonnelTable();

    alert('人员信息表已清除。');
});

// 函数：更新人员信息表格（处理AI返回的修改）
function updatePersonnelTable(markdownDiff) {
    const changesLines = markdownDiff.split('\n').map(line => line.trim()).filter(line => line !== ''); // 过滤空行

    changesLines.forEach(line => {
        if (line.startsWith('[新增]')) {
            const markdownLine = line.substring('[新增]'.length).trim();
            const person = parseMarkdownTableRow(markdownLine);
            if (person && person['人物']) {
                personnelData.push(person);
                console.log(`新增人员: ${person['人物']}`);
            }
        } else if (line.startsWith('[修改]')) {
            const markdownLine = line.substring('[修改]'.length).trim();
            const updatedPerson = parseMarkdownTableRow(markdownLine);
            if (updatedPerson && updatedPerson['人物']) {
                const existingPersonIndex = personnelData.findIndex(p => p['人物'] === updatedPerson['人物']);
                if (existingPersonIndex !== -1) {
                    personnelData[existingPersonIndex] = updatedPerson;
                    console.log(`修改人员信息: ${updatedPerson['人物']}`);
                } else {
                    console.warn(`尝试修改不存在的人员: ${updatedPerson['人物']}`);
                    // 如果修改的人物不存在，也可以选择作为新增处理
                    // personnelData.push(updatedPerson);
                    // console.log(`以新增处理修改人物: ${updatedPerson['人物']}`);
                }
            }
        } else if (line.startsWith('[删除]')) {
            const personName = line.substring('[删除]'.length).trim();
            if (personName) {
                const initialLength = personnelData.length;
                personnelData = personnelData.filter(p => p['人物'] !== personName);
                if (personnelData.length < initialLength) {
                    console.log(`删除人员: ${personName}`);
                } else {
                    console.warn(`尝试删除不存在的人员: ${personName}`);
                }
            }
        }
        // 可以添加对其他未知标记的日志记录或处理
    });

    // 重新渲染整个表格并保存到 localStorage
    renderPersonnelTable();
}

// 辅助函数：解析单行 Markdown 表格数据为对象
function parseMarkdownTableRow(markdownLine) {
    const values = markdownLine.split('|').map(v => v.trim()).filter(v => v);
    // 假设列顺序固定为 人物, 性别, 备注
    if (values.length >= 3) {
        const person = {};
        person['人物'] = values[0];
        person['性别'] = values[1];
        person['备注'] = values.slice(2).join(' | ').trim(); // 处理备注中的竖线
        return person;
    }
    return null; // 解析失败
}

// 函数：将人员数据数组转换为 Markdown 表格
function personnelDataToMarkdown(data) {
    if (!data || data.length === 0) return '';
    let markdown = '| 人物 | 性别 | 备注 |\n';
    markdown += '| --- | --- | --- |\n';
    data.forEach(person => {
        markdown += `| ${person.人物 || ''} | ${person.性别 || ''} | ${person.备注 || ''} |\n`;
    });
    return markdown;
}

// 函数：将 Markdown 表格转换为人员数据数组
function markdownToPersonnelData(markdown) {
    const lines = markdown.split('\n').map(line => line.trim()).filter(line => line.startsWith('|') && line.endsWith('|'));
    if (lines.length < 2) return []; // 需要表头和分隔线
    
    const header = lines[0].split('|').map(h => h.trim()).filter(h => h);
    const dataLines = lines.slice(2);
    
    const data = dataLines.map(line => {
        const values = line.split('|').map(v => v.trim()).filter(v => v);
        const person = {};
        header.forEach((h, index) => {
            person[h] = values[index] || '';
        });
        return person;
    });
    return data;
}

// 函数：统一渲染人员表格并保存到 localStorage
function renderPersonnelTable() {
    const markdown = personnelDataToMarkdown(personnelData);
    markdownOutputDiv.innerHTML = marked.parse(markdown);
    localStorage.setItem('personnel_data', JSON.stringify(personnelData)); // 保存数据数组
    localStorage.setItem('current_personnel_markdown', markdown); // 保存生成的Markdown字符串
}

// 生成座位列表表格
generateTableButton.addEventListener('click', () => {
    const rows = parseInt(rowsInput.value);
    const cols = parseInt(colsInput.value);
    const deskMates = parseInt(deskMatesInput.value);
    
    if (rows < 1 || cols < 1 || deskMates < 1) {
        alert('行数、列数和同桌数必须大于0。');
        return;
    }
    
    if (deskMates > cols) {
        alert('同桌数不能大于列数。');
        return;
    }

    let markdownTable = '';
    let seatCounter = 1;
    const totalSeats = rows * cols;
    const groupSize = deskMates; // 每组同桌数
    const groupsPerRow = Math.floor(cols / groupSize); // 每行能容纳的同桌组数
    const remainderSeats = cols % groupSize; // 余数座位
    
    // 生成表头
    let header = '|';
    let separator = '|';
    for (let g = 0; g < groupsPerRow; g++) {
        for (let s = 0; s < groupSize; s++) {
            header += ` 座位 |`;
            separator += ` --- |`;
        }
        if (g < groupsPerRow - 1 || remainderSeats > 0) {
            header += ` 走廊 |`;
            separator += ` --- |`;
        }
    }
    if (remainderSeats > 0) {
        for (let s = 0; s < remainderSeats; s++) {
            header += ` 座位 |`;
            separator += ` --- |`;
        }
    }
    markdownTable += header + '\n';
    markdownTable += separator + '\n';
    
    // 生成座位数据行
    for (let r = 0; r < rows; r++) {
        let rowMarkdown = '|';
        for (let g = 0; g < groupsPerRow; g++) {
            for (let s = 0; s < groupSize; s++) {
                const seatIndex = r * cols + g * groupSize + s + 1;
                if (seatIndex <= totalSeats) {
                    rowMarkdown += ` 座位${seatIndex} |`;
                } else {
                    rowMarkdown += `  |`;
                }
            }
            if (g < groupsPerRow - 1 || remainderSeats > 0) {
                rowMarkdown += `  |`; // 走廊
            }
        }
        if (remainderSeats > 0) {
            for (let s = 0; s < remainderSeats; s++) {
                const seatIndex = r * cols + groupsPerRow * groupSize + s + 1;
                if (seatIndex <= totalSeats) {
                    rowMarkdown += ` 座位${seatIndex} |`;
                } else {
                    rowMarkdown += `  |`;
                }
            }
        }
        markdownTable += rowMarkdown + '\n';
    }
    
    tablePreviewDiv.innerHTML = marked.parse(markdownTable);
    localStorage.setItem('seat_table_markdown', markdownTable); // This is the blank format
    localStorage.setItem('original_seat_format_markdown', markdownTable); // Store the pristine format
    localStorage.removeItem('arranged_seat_table_markdown'); // Clear any previous arrangement

    // 隐藏并重置微调座位区域，因为表格结构已更新
    if (seatModificationSection) {
        seatModificationSection.style.display = 'none';
    }
    if (seatModificationInput) {
        seatModificationInput.value = '';
    }
    if (seatModificationOutput) {
        seatModificationOutput.innerHTML = '';
        seatModificationOutput.style.display = 'none';
    }
    seatModificationConversationHistory = [];
    
    // 更新总人数显示
    const totalSeatsElement = document.getElementById('total-seats');
    if (totalSeatsElement) {
        totalSeatsElement.textContent = `总人数: ${totalSeats}`;
    } else {
        console.warn('total-seats 元素未找到，无法更新总人数显示。');
    }
});

// AI 智能编排座位
const aiArrangeButton = document.getElementById('ai-arrange-button');
const arrangementRemarksInput = document.getElementById('arrangement-remarks');
const aiThinkingOutputDiv = document.getElementById('ai-thinking-output');
const aiThinkingPre = aiThinkingOutputDiv.querySelector('pre');

// AI 智能编排座位
aiArrangeButton.addEventListener('click', async () => {
    const remarks = arrangementRemarksInput.value.trim();
    const personnelTable = personnelDataToMarkdown(personnelData); // 直接使用当前内存中的人员数据生成Markdown
    const seatTableFormat = localStorage.getItem('seat_table_markdown') || tablePreviewDiv.innerText; // 从localStorage或DOM获取

    const seatingConfig = getModelConfig('seating');

    if (!seatingConfig || !seatingConfig.baseURL || !seatingConfig.modelId || !seatingConfig.apiKey) {
        alert('请先配置并保存座位排布的模型信息（Base URL, Model ID, API Key）。');
        return;
    }

    if (!personnelTable || personnelTable.trim() === '') {
        alert('请先生成人员信息表。');
        return;
    }

    if (!seatTableFormat || seatTableFormat.trim() === '') {
        alert('请先生成座位列表。');
        return;
    }

    aiThinkingOutputDiv.style.display = 'block';
    aiThinkingPre.textContent = ''; // 清空旧的思考过程
    // tablePreviewDiv.innerHTML = '<p>AI 正在编排座位...</p>'; // 保留现有表格或显示空表
    const originalSeatFormatMarkdown = localStorage.getItem('original_seat_format_markdown') || '';
    if (tablePreviewDiv.innerHTML.trim() === '' && originalSeatFormatMarkdown) {
        tablePreviewDiv.innerHTML = marked.parse(originalSeatFormatMarkdown); // 如果当前为空，则显示原始空表
    }
    // 如果已有内容，则暂时保留，AI处理完成后会覆盖
    aiArrangeButton.disabled = true;

    const systemPrompt = `
你的任务是根据提供的人物表和备注内容，为人物编排教室的座位，并按照座位表格式输出编排好的座位信息。
以下是参与座位编排的人物信息：
<人物表>
${personnelTable}
</人物表>
编排座位时需要考虑的备注信息如下：
<备注>
${remarks}
</备注>
在编排座位时，请遵循以下原则：
- 保持编排合理，表格靠上的是前排，挨在一起的是同桌。
- 要综合考虑人物表和备注的内容来安排座位。
- 务必确保人员信息表中的所有人物都被编排到座位上，并且不存在重复和遗漏。
- 如果备注中有特定的座位要求，请优先满足这些要求。
以下是座位表格式，你需要将表格中"座位一，座位二…"的信息替换为人物表中的人物，不修改表格其他内容：
<座位表格式>
${seatTableFormat}
</座位表格式>
- 如果我提供的人物表中的人数不足以填满座位表，请在表格中用"空座位"替代。
- 如果我提供的人物表中的人数超过了座位表的座位数，并没有被编排进去的人请在表格中用"人物（未被编排）"注明。

请在<编排好的座位表>标签内输出修改后的表格。
`;

    try {
        const response = await fetch(`${seatingConfig.baseURL}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${seatingConfig.apiKey}`
            },
            body: JSON.stringify({
                model: seatingConfig.modelId,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: '请根据我提供的信息开始编排座位。' } // 简单的用户触发消息
                ],
                stream: true
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API 请求失败: ${response.status} ${response.statusText} - ${errorData.error?.message || '未知错误'}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulatedContent = '';
        let thinkingContent = '';
        let inThinkingBlock = false;
        let finalTableContent = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonData = line.substring(6).trim();
                    if (jsonData === '[DONE]') {
                        break;
                    }
                    try {
                        const parsedData = JSON.parse(jsonData);
                        // 检查是否有 reasoning_content 或 content
                        const reasoningContent = parsedData.choices[0]?.delta?.reasoning_content;
                        const outputContent = parsedData.choices[0]?.delta?.content;
                        
                        if (reasoningContent) {
                            thinkingContent += reasoningContent;
                            aiThinkingPre.textContent = thinkingContent;
                            // 自动滚动到底部
                            aiThinkingPre.scrollTop = aiThinkingPre.scrollHeight;
                            aiThinkingOutputDiv.style.display = 'block'; // 确保显示思考过程区域
                        }
                        
                        if (outputContent) {
                            finalTableContent += outputContent;
                            // 检查内容中是否包含表格标记
                            const tableMatch = finalTableContent.match(/\|.*\|/);
                            if (tableMatch) {
                                tablePreviewDiv.innerHTML = marked.parse(finalTableContent); // 只在包含表格时渲染
                            }
                        }
                    } catch (e) {
                        console.error('解析 SSE 数据块时出错:', e, '数据块:', jsonData);
                    }
                }
            }
            if (typeof jsonData !== 'undefined' && jsonData === '[DONE]') break; // 跳出内层循环后再次检查
        }

        // 流结束后，检查是否有最终的表格内容
        if (finalTableContent.trim()) {
            // 提取表格内容
            const tableMatch = finalTableContent.match(/(\|.*\|[\s]*)+/);
            if (tableMatch) {
                const tableContent = tableMatch[0];
                tablePreviewDiv.innerHTML = marked.parse(tableContent);
                localStorage.setItem('arranged_seat_table_markdown', tableContent); // 保存编排后的表格
                // 可以选择隐藏思考过程区域
                aiThinkingOutputDiv.style.display = 'none';
                // 应用性别着色
                applyGenderColoring();
                openSeatModificationDialog(); // Open modification dialog
            } else {
                tablePreviewDiv.innerHTML = '<p>AI 未能按预期格式返回编排好的座位表。</p>';
                console.error('未能从 AI 响应中提取编排好的座位表:', finalTableContent);
                if (seatModificationSection) seatModificationSection.style.display = 'none'; // 隐藏微调（如果出错）
                aiThinkingOutputDiv.style.display = 'block'; // 保留思考过程以供调试
            }
        } else {
            tablePreviewDiv.innerHTML = '<p>AI 未能按预期格式返回编排好的座位表。</p>';
            console.error('未能从 AI 响应中提取编排好的座位表:', accumulatedContent);
            if (seatModificationSection) seatModificationSection.style.display = 'none'; // 隐藏微调（如果出错）
            aiThinkingOutputDiv.style.display = 'block'; // 保留思考过程以供调试
        }

    } catch (error) {
        console.error('调用 DeepSeek API 进行座位编排时出错:', error);
        tablePreviewDiv.innerHTML = `<p style="color: red;">座位编排失败: ${error.message}</p>`;
        if (seatModificationSection) seatModificationSection.style.display = 'none'; // 隐藏微调（如果出错）
        // 显示错误信息和可能的思考过程
        aiThinkingPre.textContent += `\n\n错误: ${error.message}`;
        aiThinkingOutputDiv.style.display = 'block'; // 确保错误时思考过程可见
    } finally {
        aiArrangeButton.disabled = false;
    }
});

// 应用性别着色
function applyGenderColoring() {
    const personnelTable = localStorage.getItem('personnel_table_markdown') || '';
    if (!personnelTable) return;

    const tableElement = tablePreviewDiv.querySelector('table');
    if (!tableElement) return;

    // 提取人员性别信息
    const genderMap = {};
    const personnelLines = personnelTable.split('\n');
    for (let i = 2; i < personnelLines.length; i++) { // 跳过表头和分隔行
        const line = personnelLines[i].trim();
        if (line) {
            const parts = line.split('|').map(part => part.trim());
            if (parts.length >= 3) {
                const name = parts[1];
                const gender = parts[2];
                genderMap[name] = gender;
            }
        }
    }

    // 对座位表格中的人员应用着色
    const cells = tableElement.querySelectorAll('td');
    cells.forEach(cell => {
        const name = cell.textContent.trim();
        if (genderMap[name]) {
            if (genderMap[name].includes('男')) {
                cell.style.backgroundColor = '#e6f3ff'; // 浅蓝色
            } else if (genderMap[name].includes('女')) {
                cell.style.backgroundColor = '#ffe6f2'; // 浅桃红色
            }
        }
    });
}

// Event listener for importing seat table from markdown
if (importSeatTableButton) {
    importSeatTableButton.addEventListener('click', () => {
        const markdown = importSeatTableMarkdownTextarea.value.trim();
        if (!markdown) {
            alert('请粘贴要导入的座位表Markdown。');
            return;
        }

        // Basic validation: check for at least a header and a separator line
        const lines = markdown.split('\n');
        if (lines.length < 2 || !lines[0].includes('|') || !lines[1].includes('---')) {
            alert('Markdown格式似乎不正确，至少需要包含表头和分隔行。');
            return;
        }

        tablePreviewDiv.innerHTML = marked.parse(markdown);
        localStorage.setItem('arranged_seat_table_markdown', markdown); // Store as arranged, as this is the current state
        alert('座位表已成功导入并显示。');
        importSeatTableMarkdownTextarea.value = ''; // Clear the textarea

        // Potentially trigger other actions, e.g., apply gender coloring if applicable
        applyGenderColoring(); 
        // If "修改座位" dialog should appear now, trigger it
        openSeatModificationDialog();
    });
}

// Function to open/show the seat modification dialog/section
function openSeatModificationDialog() {
    if (seatModificationSection) {
        seatModificationSection.style.display = 'flex'; // Or 'block', depending on CSS
        if (seatModificationInput) seatModificationInput.value = ''; // Clear previous input
        if (seatModificationOutput) {
            seatModificationOutput.innerHTML = ''; // Clear previous output
            seatModificationOutput.style.display = 'none';
        }
        seatModificationConversationHistory = []; // Reset conversation for this new modification session
    }
}

// Event listener for sending seat modification instruction
if (sendSeatModificationButton) {
    sendSeatModificationButton.addEventListener('click', async () => {
        const modificationInstruction = seatModificationInput.value.trim();
        if (!modificationInstruction) {
            alert('请输入修改指令。');
            return;
        }

        const currentPersonnelTable = personnelDataToMarkdown(personnelData);
        // 优先从 localStorage 获取最新的已编排座位表 Markdown
        let currentSeatTable = localStorage.getItem('arranged_seat_table_markdown');
        const originalSeatFormat = localStorage.getItem('original_seat_format_markdown') || "";

        // 如果 localStorage 中没有已编排的座位表，则使用原始空格式作为当前座位表
        // 这确保 currentSeatTable 始终是 Markdown 格式
        if (!currentSeatTable || currentSeatTable.trim() === "") {
            currentSeatTable = originalSeatFormat;
            // 同时，如果 tablePreviewDiv 是空的，也用原始格式填充它，以保持视觉一致性
            if (tablePreviewDiv.innerHTML.trim() === "" && originalSeatFormat) {
                 tablePreviewDiv.innerHTML = marked.parse(originalSeatFormat);
            }
        }
        
        // 生成原始座位与当前座位内容的映射关系
        let seatMappingInfo = "原始座位与当前内容的对应关系如下 (用于帮助您理解当前占用情况):\n";
        const originalFormatArrayForMapping = markdownTableToArray(originalSeatFormat);
        const currentSeatTableArrayForMapping = markdownTableToArray(currentSeatTable);

        if (originalFormatArrayForMapping.length > 0 && currentSeatTableArrayForMapping.length > 0 && originalFormatArrayForMapping.length === currentSeatTableArrayForMapping.length) {
            for (let r = 0; r < originalFormatArrayForMapping.length; r++) {
                // 跳过表头和分隔符行
                if (r === 0 || originalFormatArrayForMapping[r].some(cell => cell.includes('---'))) continue;
                for (let c = 0; c < originalFormatArrayForMapping[r].length; c++) {
                    const originalSeatPlaceholder = originalFormatArrayForMapping[r][c];
                    const currentSeatContent = currentSeatTableArrayForMapping[r] ? (currentSeatTableArrayForMapping[r][c] || '未知') : '未知';
                    if (originalSeatPlaceholder && !originalSeatPlaceholder.trim().toLowerCase().includes('走廊') && originalSeatPlaceholder.trim() !== '') { // 只映射有效座位
                        seatMappingInfo += `- ${originalSeatPlaceholder.trim()}: 当前是 "${currentSeatContent.trim()}"\n`;
                    }
                }
            }
        } else {
            seatMappingInfo = "无法生成详细的座位映射信息，请主要参考下方提供的<当前座位表>。\n";
        }


        const modificationModel = getModelConfig('seat_modification');
        if (!modificationModel || !modificationModel.baseURL || !modificationModel.modelId || !modificationModel.apiKey) {
            alert('请先配置并保存“座位修改”的模型信息。');
            return;
        }

        if (seatModificationLoading) seatModificationLoading.style.display = 'block';
        if (seatModificationOutput) {
            seatModificationOutput.innerHTML = ''; // Clear previous AI output
            seatModificationOutput.style.display = 'none';
        }
        sendSeatModificationButton.disabled = true;

        // 每次都重新构建系统提示词，以包含最新的表格状态
        const systemPromptForSeatModification = `
你的任务是根据用户提供的人物信息表、当前的座位表以及用户的修改指令，对座位表进行细微调整。

当前人员信息表（供参考，你可以自行判断是否与修改指令相关）：
<人物表>
${currentPersonnelTable}
</人物表>

这是供您参考的原始空座位表结构，其中包含所有可用的座位占位符。您在指令中引用座位时，可以使用这些占位符（例如 "座位1", "座位7"）：
<原始座位表格式>
${originalSeatFormat}
</原始座位表格式>

当前的座位表如下，请基于此表进行修改：
<当前座位表>
${currentSeatTable}
</当前座位表>

为了帮助您准确理解当前每个原始座位上的人员情况，以下是原始座位占位符与当前实际内容的对应列表：
${seatMappingInfo}
请您在处理用户指令时，务必参考此对应列表来确定用户所说的“座位X”当前具体是哪位人员或什么状态。

请根据用户的最新修改指令，对上方提供的<当前座位表>进行调整。这是您需要操作的唯一真实座位状态。
您不需要输出完整的座位表，只需要输出具体的修改操作。**为了确保系统能正确解析您的操作，请严格按照以下格式描述您的修改，每项修改占一行，并全部包裹在 <seat_changes> 和 </seat_changes> 标签内：**
1. 交换座位: \`[SWAP] 座位X <-> 座位Y\` (例如: \`[SWAP] 座位3 <-> 座位7\` 表示交换座位3和座位7上的人)
2. 移动人物到空位: \`[MOVE] 人物A TO 座位X\` (例如: \`[MOVE] 李四 TO 座位10\` 表示将李四移动到座位10，原座位变为空)
3. 清空座位: \`[EMPTY] 座位X\` (例如: \`[EMPTY] 座位5\` 表示将座位5清空)
4. 将人物填入空位: \`[FILL] 座位X WITH 人物A\` (如果人物A当前不在任何座位上, 例如: \`[FILL] 座位2 WITH 王五\`)

**重要：**
- 如果有多项修改，请确保每项修改都遵循上述格式并单独占一行。
- 如果无法完全按用户指令修改（例如，目标座位已有人且不是交换指令），请在 <seat_changes> 标签内用纯文本清晰地说明原因或提出替代方案，不要尝试使用上述操作格式进行无效操作。
- 如果用户的指令没有意义或无法操作，请在 <seat_changes> 标签内直接说明。
- **任何不符合上述格式的输出都可能导致修改无法被系统正确应用。**

请将你的修改操作包裹在 <seat_changes> 和 </seat_changes> 标签内。
例如：
<seat_changes>
[SWAP] 座位1 <-> 座位4
[MOVE] 张三 TO 座位8
</seat_changes>
`;

        // 构建本次请求的 messages 数组
        // 移除历史记录中旧的系统提示（如果存在），并添加最新的系统提示
        const currentTurnMessages = [];
        currentTurnMessages.push({ role: 'system', content: systemPromptForSeatModification });

        // 添加之前的用户和助手消息（不包括旧的系统消息）
        // seatModificationConversationHistory 在每次修改会话开始时已清空 (openSeatModificationDialog)
        // 所以这里它只包含当前修改会话的指令和回复
        // 但为了确保AI有上下文，我们需要保留这个历史
        // 关键是 system prompt 要是最新的

        // 将当前用户的指令添加到历史记录中，准备发送
        seatModificationConversationHistory.push({ role: 'user', content: modificationInstruction });
        
        // 构造发送给API的最终消息列表
        // 最新的系统提示 + 完整的当前修改会话历史（包括最新的用户指令）
        const messagesForAPI = [
            { role: 'system', content: systemPromptForSeatModification },
            ...seatModificationConversationHistory // 这包含了从本次修改会话开始的所有用户和助手消息
        ];


        try {
            const response = await fetch(`${modificationModel.baseURL}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${modificationModel.apiKey}`
                },
                body: JSON.stringify({
                    model: modificationModel.modelId,
                    messages: messagesForAPI, // 使用新构建的包含最新系统提示的消息列表
                    stream: true 
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API 请求失败: ${response.status} ${response.statusText} - ${errorData.error?.message || '未知错误'}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let accumulatedResponse = "";
            
            if(seatModificationOutput) {
                seatModificationOutput.textContent = ''; // 清空上一轮的AI回复
                seatModificationOutput.style.display = 'block';
            }

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonData = line.substring(6).trim();
                        if (jsonData === '[DONE]') break;
                        try {
                            const parsedData = JSON.parse(jsonData);
                            const delta = parsedData.choices[0]?.delta?.content;
                            if (delta) {
                                accumulatedResponse += delta;
                                if(seatModificationOutput) seatModificationOutput.textContent = accumulatedResponse; // Display raw AI response for now
                            }
                        } catch (e) { console.error('解析修改座位SSE数据块时出错:', e, '数据块:', jsonData); }
                    }
                }
            }
            
            seatModificationConversationHistory.push({ role: 'assistant', content: accumulatedResponse });
            
            const originalFormatForProcessing = localStorage.getItem('original_seat_format_markdown') || "";
            // currentArrangedTableForProcessing 应该总是从 localStorage 获取，以确保它是AI应该操作的最新状态的Markdown版本
            let currentArrangedTableForProcessing = localStorage.getItem('arranged_seat_table_markdown');
            if (!currentArrangedTableForProcessing || currentArrangedTableForProcessing.trim() === "") {
                currentArrangedTableForProcessing = originalFormatForProcessing;
            }

            const { newSeatTableMarkdown, changesSummary } = processSeatChanges(accumulatedResponse, currentArrangedTableForProcessing, originalFormatForProcessing);

            if (newSeatTableMarkdown) {
                tablePreviewDiv.innerHTML = marked.parse(newSeatTableMarkdown); // 更新渲染
                localStorage.setItem('arranged_seat_table_markdown', newSeatTableMarkdown); // 更新存储
                applyGenderColoring();
                if (seatModificationOutput) {
                    // 显示成功应用的修改摘要，而不是原始AI回复
                    seatModificationOutput.innerHTML = `<strong>已应用修改:</strong><br><pre>${changesSummary}</pre>`;
                }
            } else if (changesSummary) { // AI 可能返回了文本消息或无法解析的修改
                 if (seatModificationOutput) {
                    // 显示AI的原始回复（已经通过流式输出到textContent了），或者格式化后的changesSummary（如果它是纯文本回复）
                    // 如果 accumulatedResponse 包含 <seat_changes> 但解析失败，changesSummary 会是 accumulatedResponse
                    // 如果 accumulatedResponse 不包含 <seat_changes>，changesSummary 也是 accumulatedResponse
                    // 如果AI明确说“没有修改”，changesSummary会是“AI 表示没有修改。”
                    if (accumulatedResponse.includes("<seat_changes>")) { // AI尝试了格式但可能失败
                        seatModificationOutput.innerHTML = `<strong>AI回复 (解析尝试后的摘要):</strong><br><pre>${changesSummary}</pre><br>原始回复:<pre>${accumulatedResponse}</pre>`;
                    } else { // AI直接返回文本
                         seatModificationOutput.innerHTML = `<strong>AI 回复:</strong><br><pre>${changesSummary}</pre>`;
                    }
                }
            } else {
                // 如果既没有 newSeatTableMarkdown 也没有 changesSummary (例如AI返回空)
                if (seatModificationOutput) {
                    seatModificationOutput.textContent = accumulatedResponse; // 仍然显示原始累积响应
                }
            }
             if(seatModificationOutput) seatModificationOutput.style.display = 'block';


        } catch (error) {
            console.error('修改座位时出错:', error);
            if (seatModificationOutput) {
                seatModificationOutput.innerHTML = `<p style="color: red;">修改座位失败: ${error.message}</p>`;
                seatModificationOutput.style.display = 'block';
            }
        } finally {
            if (seatModificationLoading) seatModificationLoading.style.display = 'none';
            sendSeatModificationButton.disabled = false;
            // seatModificationInput.value = ''; // Optionally clear input
        }
    });
}

// Helper function to parse Markdown table to 2D array
function markdownTableToArray(markdown) {
    if (!markdown || typeof markdown !== 'string') return [];
    const rows = markdown.trim().split('\n');
    return rows.map(row => 
        row.split('|').map(cell => cell.trim()).filter((cell, index, arr) => 
            index !== 0 && index !== arr.length -1 // Remove empty cells from start/end due to leading/trailing |
        )
    );
}

// Helper function to convert 2D array back to Markdown table
function arrayToMarkdownTable(array) {
    if (!array || array.length === 0) return "";
    return array.map(row => `| ${row.join(' | ')} |`).join('\n');
}

// Function to process AI's seat change instructions
function processSeatChanges(aiResponse, currentSeatTableMarkdown, originalSeatFormatMarkdown) {
    let newSeatTableMarkdown = null;
    let changesSummary = "";

    const changesMatch = aiResponse.match(/<seat_changes>([\s\S]*?)<\/seat_changes>/i);
    if (!changesMatch || !changesMatch[1]) {
        changesSummary = aiResponse.trim();
        return { newSeatTableMarkdown, changesSummary };
    }

    const changeInstructions = changesMatch[1].trim().split('\n').map(line => line.trim()).filter(line => line);
    
    if (changeInstructions.length === 0 || changeInstructions[0].toLowerCase() === "没有修改") {
        changesSummary = "AI 表示没有修改。";
        return { newSeatTableMarkdown: currentSeatTableMarkdown, changesSummary };
    }

    let seatTableArray = markdownTableToArray(currentSeatTableMarkdown);
    const originalFormatArray = markdownTableToArray(originalSeatFormatMarkdown); // Parse original format
    const appliedChanges = [];
    let tableWasModified = false;

    // Helper to find a cell's coordinates in the original format by its placeholder text (e.g., "座位1")
    function mapPlaceholderToCoords(placeholderText, formatArray) {
        for (let r = 0; r < formatArray.length; r++) {
            // Skip header and separator
            if (r === 0 || formatArray[r].some(cell => cell.includes('---'))) continue;
            for (let c = 0; c < formatArray[r].length; c++) {
                if (formatArray[r][c] === placeholderText) {
                    return { r, c };
                }
            }
        }
        return null;
    }

    // Helper to find a person's current coordinates in the seatTableArray
    function findPersonCoords(personName, currentTableArray) {
        for (let r = 0; r < currentTableArray.length; r++) {
            if (r === 0 || currentTableArray[r].some(cell => cell.includes('---'))) continue;
            for (let c = 0; c < currentTableArray[r].length; c++) {
                if (currentTableArray[r][c] === personName) {
                    return { r, c };
                }
            }
        }
        return null;
    }

    for (const instruction of changeInstructions) {
        let match;
        if ((match = instruction.match(/^\[SWAP\]\s*(.+?)\s*<->\s*(.+)$/i))) {
            const item1Placeholder = match[1].trim(); // AI should use placeholder like "座位X"
            const item2Placeholder = match[2].trim(); // AI should use placeholder like "座位Y"
            
            const coords1 = mapPlaceholderToCoords(item1Placeholder, originalFormatArray);
            const coords2 = mapPlaceholderToCoords(item2Placeholder, originalFormatArray);

            if (coords1 && coords2 && seatTableArray[coords1.r] && seatTableArray[coords2.r]) {
                const temp = seatTableArray[coords1.r][coords1.c];
                seatTableArray[coords1.r][coords1.c] = seatTableArray[coords2.r][coords2.c];
                seatTableArray[coords2.r][coords2.c] = temp;
                appliedChanges.push(`交换了 ${item1Placeholder} (原内容: ${seatTableArray[coords1.r][coords1.c]}) 和 ${item2Placeholder} (原内容: ${seatTableArray[coords2.r][coords2.c]}) 的位置。`);
                tableWasModified = true;
            } else {
                appliedChanges.push(`[错误] 交换失败: 原始座位 "${item1Placeholder}" 或 "${item2Placeholder}" 未在格式表中找到。`);
            }
        } else if ((match = instruction.match(/^\[MOVE\]\s*(.+?)\s*TO\s*(.+)$/i))) {
            const personName = match[1].trim();
            const targetSeatPlaceholder = match[2].trim(); // e.g., "座位X"

            const personOldCoords = findPersonCoords(personName, seatTableArray);
            const targetCoords = mapPlaceholderToCoords(targetSeatPlaceholder, originalFormatArray);

            if (targetCoords) {
                const currentTargetContent = seatTableArray[targetCoords.r][targetCoords.c];
                // Allow moving to an empty/placeholder seat, or if target is the person themselves (no change)
                if (currentTargetContent.toLowerCase() === '空座位' || currentTargetContent === targetSeatPlaceholder || currentTargetContent === personName) {
                    if (personOldCoords) {
                        seatTableArray[personOldCoords.r][personOldCoords.c] = '空座位'; // Make old seat empty
                    }
                    seatTableArray[targetCoords.r][targetCoords.c] = personName;
                    appliedChanges.push(`将 "${personName}" 移动到 "${targetSeatPlaceholder}"。`);
                    tableWasModified = true;
                } else {
                    appliedChanges.push(`[错误] 移动 "${personName}" 失败: 目标 "${targetSeatPlaceholder}" 已被 "${currentTargetContent}" 占据。`);
                }
            } else {
                appliedChanges.push(`[错误] 移动 "${personName}" 失败: 目标座位 "${targetSeatPlaceholder}" 未在格式表中找到。`);
            }
        } else if ((match = instruction.match(/^\[EMPTY\]\s*(.+)$/i))) {
            const seatToEmptyPlaceholder = match[1].trim(); // e.g., "座位X"
            const coords = mapPlaceholderToCoords(seatToEmptyPlaceholder, originalFormatArray);
            if (coords) {
                appliedChanges.push(`清空了 "${seatToEmptyPlaceholder}" (原内容: ${seatTableArray[coords.r][coords.c]})。`);
                seatTableArray[coords.r][coords.c] = '空座位'; // Or restore original placeholder text from originalFormatArray
                tableWasModified = true;
            } else {
                appliedChanges.push(`[错误] 清空失败: 座位 "${seatToEmptyPlaceholder}" 未在格式表中找到。`);
            }
        } else if ((match = instruction.match(/^\[FILL\]\s*(.+?)\s*WITH\s*(.+)$/i))) {
            const seatToFillPlaceholder = match[1].trim(); // e.g., "座位X"
            const personName = match[2].trim();
            const targetCoords = mapPlaceholderToCoords(seatToFillPlaceholder, originalFormatArray);

            if (targetCoords) {
                const currentTargetContent = seatTableArray[targetCoords.r][targetCoords.c];
                if (currentTargetContent.toLowerCase() === '空座位' || currentTargetContent === seatToFillPlaceholder) {
                    const personAlreadySeatedCoords = findPersonCoords(personName, seatTableArray);
                    if (personAlreadySeatedCoords) {
                        appliedChanges.push(`[警告] 填入 "${personName}" 失败: 该人员已在座位 (内容: ${seatTableArray[personAlreadySeatedCoords.r][personAlreadySeatedCoords.c]}) 。请先将其移开或清空。`);
                    } else {
                        seatTableArray[targetCoords.r][targetCoords.c] = personName;
                        appliedChanges.push(`将 "${personName}" 填入 "${seatToFillPlaceholder}"。`);
                        tableWasModified = true;
                    }
                } else {
                     appliedChanges.push(`[错误] 填入 "${personName}" 失败: "${seatToFillPlaceholder}" 已被 "${currentTargetContent}" 占据。`);
                }
            } else {
                 appliedChanges.push(`[错误] 填入 "${personName}" 失败: 座位 "${seatToFillPlaceholder}" 未在格式表中找到。`);
            }
        } else {
            appliedChanges.push(instruction); // Treat as AI message if no specific command format matched
        }
    }
    
    if (tableWasModified) {
        newSeatTableMarkdown = arrayToMarkdownTable(seatTableArray);
    } else {
        // If no structural changes were made but AI provided instructions/feedback,
        // keep changesSummary but newSeatTableMarkdown remains null.
        newSeatTableMarkdown = null; 
    }
    changesSummary = appliedChanges.join('\n');
    
    return { newSeatTableMarkdown, changesSummary };
}


// Event listener for importing personnel table from markdown
importPersonnelButton.addEventListener('click', () => {
    const markdown = importPersonnelMarkdownTextarea.value.trim();
    if (!markdown) {
        alert('请粘贴要导入的Markdown表格。');
        return;
    }

    const importedData = markdownToPersonnelData(markdown);
    if (importedData.length > 0) {
        personnelData = importedData;
        renderPersonnelTable(); // Update UI and localStorage
        alert(`成功导入 ${importedData.length} 条人员信息。`);
        importPersonnelMarkdownTextarea.value = ''; // Clear the textarea after import
    } else {
        alert('未能解析为有效的人员信息表格，请检查Markdown格式是否正确（需要表头、分隔线和数据行）。');
    }
});

// Event listener for copying the seat table format - REMOVED as button is removed
// if (copyTableButton) {
//     copyTableButton.addEventListener('click', () => {
//         const markdownTable = localStorage.getItem('seat_table_markdown') || '';
//         if (markdownTable) {
//             navigator.clipboard.writeText(markdownTable).then(() => {
//                 alert('座位格式已复制到剪贴板！');
//             }, () => {
//                 alert('复制失败，请手动复制表格内容。');
//             });
//         } else {
//             alert('请先生成座位格式。');
//         }
//     });
// }

// Event listener for copying the arranged seat table
copyArrangedTableButton.addEventListener('click', () => {
    const arrangedMarkdownTable = localStorage.getItem('arranged_seat_table_markdown') || '';
    if (arrangedMarkdownTable) {
        navigator.clipboard.writeText(arrangedMarkdownTable).then(() => {
            alert('编排好的座位表已复制到剪贴板！');
        }, () => {
            alert('复制失败，请手动复制表格内容。');
        });
    } else {
        alert('请先进行AI智能编排。');
    }
});

// Event listener for copying the personnel info
if (copyPersonnelInfoButton) {
    copyPersonnelInfoButton.addEventListener('click', () => {
        const markdownToCopy = personnelDataToMarkdown(personnelData);
        if (markdownToCopy) {
            navigator.clipboard.writeText(markdownToCopy).then(() => {
                alert('人员信息已复制到剪贴板！');
            }, () => {
                alert('复制失败，请手动复制。');
            });
        } else {
            alert('当前没有人员信息可复制。');
        }
    });
}
