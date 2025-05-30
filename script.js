// const apiKeyInput = document.getElementById('api-key');
// const saveKeyButton = document.getElementById('save-key');
const personDescriptionInput = document.getElementById('person-description');
const sendDescriptionButton = document.getElementById('send-description');
const loadingIndicator = document.getElementById('loading');
const markdownOutputDiv = document.getElementById('markdown-output');
const markdownOutputWrapper = document.getElementById('markdown-output-wrapper');
const outputSection = document.querySelector('.output-section'); // Parent of markdownOutputWrapper
const contentWrapper = document.querySelector('.content-wrapper'); // Parent of outputSection
const togglePersonnelListButton = document.getElementById('toggle-personnel-list');
// const toggleApiKeyButton = document.getElementById('toggle-api-key');
// const apiKeySection = document.getElementById('api-key-section');
const rowsInput = document.getElementById('rows');
const colsInput = document.getElementById('cols');
const deskMatesInput = document.getElementById('desk-mates');
const tablePreviewDiv = document.getElementById('table-preview');
// const generateTableButton = document.getElementById('generate-table'); // 按钮已被移除或功能合并

// Sidebar elements
const settingsSidebar = document.getElementById('settings-sidebar');
// const openSettingsButton = document.getElementById('open-settings-button'); // 旧按钮，已在HTML中移除
const sidebarToggleButton = document.getElementById('sidebar-toggle-button'); // 新的左下角按钮
const appWrapper = document.querySelector('.app-wrapper'); // App wrapper for content shift
const mainContainer = document.querySelector('.container'); // Main content container

// DeepSeek Quick Config
const deepseekApiKeyInput = document.getElementById('deepseek-api-key');
const quickConfigDeepseekButton = document.getElementById('quick-config-deepseek');

// Provider Settings
const providerListDiv = document.getElementById('provider-list');
const addProviderButton = document.getElementById('add-provider-button');

// Model Usage Settings - Custom Selects
const infoModelTrigger = document.getElementById('info-model-trigger');
const infoModelDropdown = document.getElementById('info-model-dropdown');
const infoModelSearchInput = infoModelDropdown ? infoModelDropdown.querySelector('.model-search-input') : null;
const infoModelOptionsList = infoModelDropdown ? infoModelDropdown.querySelector('.custom-options-list') : null;
const infoModelSelectValue = document.getElementById('info-model-select-value');

const seatingModelTrigger = document.getElementById('seating-model-trigger');
const seatingModelDropdown = document.getElementById('seating-model-dropdown');
const seatingModelSearchInput = seatingModelDropdown ? seatingModelDropdown.querySelector('.model-search-input') : null;
const seatingModelOptionsList = seatingModelDropdown ? seatingModelDropdown.querySelector('.custom-options-list') : null;
const seatingModelSelectValue = document.getElementById('seating-model-select-value');

const seatModifyModelTrigger = document.getElementById('seat-modify-model-trigger');
const seatModifyModelDropdown = document.getElementById('seat-modify-model-dropdown');
const seatModifyModelSearchInput = seatModifyModelDropdown ? seatModifyModelDropdown.querySelector('.model-search-input') : null;
const seatModifyModelOptionsList = seatModifyModelDropdown ? seatModifyModelDropdown.querySelector('.custom-options-list') : null;
const seatModifyModelSelectValue = document.getElementById('seat-modify-model-select-value');

const saveModelUsageButton = document.getElementById('save-model-usage-button');
const activeConfigDisplayDiv = document.getElementById('active-config-display'); // Re-purposed for showing current task model
const activeConfigStrongElement = activeConfigDisplayDiv ? activeConfigDisplayDiv.querySelector('strong') : null;


const clearPersonnelTableButton = document.getElementById('clear-personnel-table');
const importPersonnelMarkdownTextarea = document.getElementById('import-personnel-markdown');
const importPersonnelButton = document.getElementById('import-personnel-button');
const copyArrangedTableButton = document.getElementById('copy-arranged-table');
const copyPersonnelInfoButton = document.getElementById('copy-personnel-info');
const importSeatTableMarkdownTextarea = document.getElementById('import-seat-table-markdown');
const importSeatTableButton = document.getElementById('import-seat-table-button');

// Seat Modification UI Elements
const seatModificationSection = document.getElementById('seat-modification-section');
const seatModificationInput = document.getElementById('seat-modification-input');
const sendSeatModificationButton = document.getElementById('send-seat-modification-button');
const seatModificationLoading = document.getElementById('seat-modification-loading');
const seatModificationOutput = document.getElementById('seat-modification-output');

let seatModificationConversationHistory = [];
let conversationHistory = [];
let personnelData = JSON.parse(localStorage.getItem('personnel_data') || '[]');

// 新的数据结构
let providers = JSON.parse(localStorage.getItem('llm_providers') || '[]');
let modelUsageSettingsStored = localStorage.getItem('llm_model_usage_settings');
let modelUsageSettings = modelUsageSettingsStored ? JSON.parse(modelUsageSettingsStored) : {
    personnel: null,
    seating: null,
    seat_modification: null
};

// 页面加载时显示已保存的人员信息表
if (personnelData.length > 0) {
    markdownOutputDiv.innerHTML = marked.parse(personnelDataToMarkdown(personnelData));
}

// --- 保存和加载函数 ---
function saveProviders() {
    localStorage.setItem('llm_providers', JSON.stringify(providers));
}

function saveModelUsageSettings() {
    localStorage.setItem('llm_model_usage_settings', JSON.stringify(modelUsageSettings));
}

// --- 提供商配置相关函数 ---
function renderProviders() {
    providerListDiv.innerHTML = '';
    providers.forEach((provider, index) => {
        const providerItem = document.createElement('div');
        providerItem.classList.add('provider-item', 'model-config-item'); // Re-use some styling
        providerItem.dataset.providerId = provider.id;

        // 展开/折叠状态
        const isCollapsed = provider.isCollapsed === undefined ? false : provider.isCollapsed;
        if (isCollapsed) {
            providerItem.classList.add('collapsed');
        }

        providerItem.innerHTML = `
            <div class="config-item-header" data-provider-index="${index}">
                <h3>
                    <span class="collapse-icon">${isCollapsed ? '▶' : '▼'}</span>
                    ${provider.name || `提供商 #${index + 1}`}
                </h3>
            </div>
            <div class="config-item-content">
                <label>提供商名称:</label>
                <input type="text" class="provider-name" placeholder="例如：My OpenAI" value="${provider.name || ''}" data-index="${index}">
                <label>Base URL:</label>
                <input type="text" class="provider-baseurl" placeholder="https://api.openai.com" value="${provider.baseURL || ''}" data-index="${index}">
                <label>API Key:</label>
                <input type="password" class="provider-apikey" placeholder="API Key" value="${provider.apiKey || ''}" data-index="${index}">
                
                <div class="model-list-controls" style="margin-top:10px;">
                    <h4>可用模型 (<span class="enabled-models-count" data-provider-id="${provider.id}">${(provider.enabledModelIds || []).length}</span> 个已启用):</h4>
                    <button type="button" class="fetch-provider-models secondary-button" data-index="${index}">获取模型列表</button>
                </div>
                <div class="custom-select-wrapper provider-available-models-select" data-provider-id="${provider.id}">
                    <button type="button" class="custom-select-trigger provider-model-select-trigger">
                        管理启用模型
                    </button>
                    <div class="custom-select-dropdown provider-model-select-dropdown">
                        <input type="text" class="model-search-input provider-model-search-input" placeholder="搜索可用模型...">
                        <ul class="custom-options-list provider-model-options-list">
                            ${(provider.availableModels || []).map(model => `
                                <li data-model-id="${model.id}">
                                    <input type="checkbox" id="chk-${provider.id}-${model.id}" class="model-enable-checkbox-dropdown" 
                                           data-provider-index="${index}" data-model-id="${model.id}" 
                                           ${(provider.enabledModelIds || []).includes(model.id) ? 'checked' : ''}>
                                    <label for="chk-${provider.id}-${model.id}">${model.name || model.id}</label>
                                </li>
                            `).join('')}
                            ${(provider.availableModels || []).length === 0 ? '<li>没有可用的模型，请先获取。</li>' : ''}
                        </ul>
                    </div>
                </div>
                <label>手动添加模型ID (每行一个):</label>
                <textarea class="manual-model-ids" placeholder="gpt-3.5-turbo\ngpt-4" data-index="${index}">${(provider.manualModelIds || []).join('\n')}</textarea>
                <button type="button" class="update-manual-models secondary-button" data-index="${index}" style="margin-top:5px;">更新手动模型</button>
                <div class="config-actions" style="margin-top:15px;">
                    <button type="button" class="remove-provider danger-button" data-index="${index}">移除此提供商</button>
                </div>
            </div>
        `;
        providerListDiv.appendChild(providerItem);
    });
    populateModelSelects(); // Re-populate selects whenever providers change
}

function addProvider() {
    const newProvider = {
        id: `provider-${Date.now()}`,
        name: '',
        baseURL: '',
        apiKey: '',
        availableModels: [], // Models fetched from API
        manualModelIds: [], // Models added manually by ID
        enabledModelIds: [], // IDs of models enabled by the user from available or manual
        isCollapsed: false
    };
    providers.push(newProvider);
    saveProviders();
    renderProviders();
}

// --- 使用模型选择相关函数 (Custom Select) ---
function populateModelSelects() {
    const customSelects = [
        { list: infoModelOptionsList, valueInput: infoModelSelectValue, trigger: infoModelTrigger, currentSavedValue: modelUsageSettings.personnel },
        { list: seatingModelOptionsList, valueInput: seatingModelSelectValue, trigger: seatingModelTrigger, currentSavedValue: modelUsageSettings.seating },
        { list: seatModifyModelOptionsList, valueInput: seatModifyModelSelectValue, trigger: seatModifyModelTrigger, currentSavedValue: modelUsageSettings.seat_modification }
    ];

    customSelects.forEach(cs => {
        if (!cs.list) return;
        cs.list.innerHTML = ''; // Clear existing options

        // Add default "未选择" option
        const defaultLi = document.createElement('li');
        defaultLi.textContent = '--选择模型--';
        defaultLi.dataset.value = '';
        cs.list.appendChild(defaultLi);

        let foundSelected = false;
        providers.forEach(provider => {
            const uniqueEnabledModels = new Set([
                ...(provider.enabledModelIds || []),
                ...(provider.manualModelIds || [])
            ]);

            uniqueEnabledModels.forEach(modelId => {
                if (!modelId.trim()) return;
                const modelDetail = (provider.availableModels || []).find(m => m.id === modelId);
                const modelName = modelDetail ? (modelDetail.name || modelId) : modelId;
                const fullValue = `${provider.id}/${modelId}`;
                const displayText = `${provider.name || '未命名提供商'} - ${modelName}`;

                const li = document.createElement('li');
                li.textContent = displayText;
                li.dataset.value = fullValue;
                cs.list.appendChild(li);

                if (cs.currentSavedValue === fullValue) {
                    cs.trigger.textContent = displayText;
                    foundSelected = true;
                }
            });
        });
        if (!foundSelected) {
            cs.trigger.textContent = '--选择模型--';
        }
    });
}

function loadModelUsage() {
    // Values are now set directly in populateModelSelects based on modelUsageSettings
    // and also when an option is clicked.
    // We just need to ensure populateModelSelects is called and then update the active display.
    if (infoModelSelectValue) infoModelSelectValue.value = modelUsageSettings.personnel || '';
    if (seatingModelSelectValue) seatingModelSelectValue.value = modelUsageSettings.seating || '';
    if (seatModifyModelSelectValue) seatModifyModelSelectValue.value = modelUsageSettings.seat_modification || '';
    
    populateModelSelects(); // This will now also update trigger texts
    updateActiveTaskModelDisplay('personnel'); 
}

function saveModelUsage() {
    modelUsageSettings.personnel = infoModelSelectValue.value;
    modelUsageSettings.seating = seatingModelSelectValue.value;
    modelUsageSettings.seat_modification = seatModifyModelSelectValue.value;
    saveModelUsageSettings();
    alert('模型使用选择已保存！');
    // updateActiveTaskModelDisplay needs to know which task type's model to display.
    // Defaulting to 'personnel' or the last interacted one.
    // For simplicity, let's assume 'personnel' or rely on currentDisplayedTaskType if it's set.
    updateActiveTaskModelDisplay(currentDisplayedTaskType || 'personnel');
}

// --- 更新当前任务模型显示 ---
function updateActiveTaskModelDisplay(taskType) {
    if (!activeConfigDisplayDiv || !activeConfigStrongElement) return;

    const selectedModelValue = modelUsageSettings[taskType];
    if (selectedModelValue) {
        const [providerId, ...modelIdParts] = selectedModelValue.split('/'); // modelIdParts can be an array
        const modelId = modelIdParts.join('/'); // Rejoin if modelId itself contained '/'
        const provider = providers.find(p => p.id === providerId);
        if (provider) {
            // Try to find full model details for name
            let modelName = modelId;
            const modelDetail = (provider.availableModels || []).find(m => m.id === modelId) || 
                                (provider.manualModelIds || []).includes(modelId) ? {id: modelId, name: modelId} : null; // Basic object if manual
            if(modelDetail && modelDetail.name) modelName = modelDetail.name;

            let taskName = '';
            if (taskType === 'personnel') taskName = '信息整理';
            else if (taskType === 'seating') taskName = '座位表生成';
            else if (taskType === 'seat_modification') taskName = '座位微调';
            
            activeConfigStrongElement.textContent = `${provider.name || '未命名提供商'} - ${modelName}`;
            activeConfigDisplayDiv.querySelector('p').textContent = `当前${taskName}模型: `;
            activeConfigDisplayDiv.style.display = 'block';
        } else {
            activeConfigStrongElement.textContent = '未选择或提供商丢失';
            activeConfigDisplayDiv.style.display = 'block';
        }
    } else {
        activeConfigStrongElement.textContent = '未选择';
        activeConfigDisplayDiv.style.display = 'block';
    }
}


// --- 获取具体任务的模型配置 ---
function getModelConfig(taskType) { // taskType: 'personnel', 'seating', 'seat_modification'
    const selectedModelString = modelUsageSettings[taskType];
    if (!selectedModelString) {
        updateActiveTaskModelDisplay(taskType); // Show "未选择"
        return null;
    }

    const parts = selectedModelString.split('/');
    const providerId = parts[0];
    const modelIdFromSelection = parts.slice(1).join('/'); 
    
    const provider = providers.find(p => p.id === providerId);

    if (provider && provider.baseURL && provider.apiKey && modelIdFromSelection) {
        const apiModelId = modelIdFromSelection;

        const config = {
            baseURL: provider.baseURL,
            apiKey: provider.apiKey,
            modelId: apiModelId, 
            providerName: provider.name || providerId,
            modelName: ((provider.availableModels || []).find(m => m.id === modelIdFromSelection) || {name: modelIdFromSelection}).name
        };
        updateActiveTaskModelDisplay(taskType); 
        return config;
    }
    updateActiveTaskModelDisplay(taskType); 
    return null;
}


// --- 事件监听器 ---

// 新的侧边栏切换逻辑
if (sidebarToggleButton && settingsSidebar && mainContainer) {
    sidebarToggleButton.addEventListener('click', (event) => {
        event.stopPropagation(); 
        const isOpen = settingsSidebar.classList.toggle('open');
        mainContainer.classList.toggle('sidebar-open-content-shift', isOpen);
        
        if (isOpen) {
            sidebarToggleButton.style.right = 'calc(350px + 20px)';
        } else {
            sidebarToggleButton.style.right = '20px';
        }
    });
}


// 提供商配置事件
if (addProviderButton) {
    addProviderButton.addEventListener('click', addProvider);
}

if (providerListDiv) {
    providerListDiv.addEventListener('change', (event) => {
        const target = event.target;
        const providerItemElement = target.closest('.provider-item'); 
        if (!providerItemElement) return;

        const providerIdFromElement = providerItemElement.dataset.providerId;
        const providerIndex = providers.findIndex(p => p.id === providerIdFromElement);

        if (providerIndex === undefined || providerIndex === -1) return;
        const provider = providers[providerIndex];
        if (!provider) return;

        if (target.classList.contains('provider-name')) {
            provider.name = target.value;
        } else if (target.classList.contains('provider-baseurl')) {
            provider.baseURL = target.value;
        } else if (target.classList.contains('provider-apikey')) {
            provider.apiKey = target.value;
        } else if (target.classList.contains('model-enable-checkbox-dropdown')) {
            const modelId = target.dataset.modelId;
            if (!provider.enabledModelIds) provider.enabledModelIds = [];
            
            if (target.checked) {
                if (!provider.enabledModelIds.includes(modelId)) {
                    provider.enabledModelIds.push(modelId);
                }
            } else {
                provider.enabledModelIds = provider.enabledModelIds.filter(id => id !== modelId);
            }
            const countSpan = providerItemElement.querySelector(`.enabled-models-count[data-provider-id="${provider.id}"]`);
            if (countSpan) {
                countSpan.textContent = (provider.enabledModelIds || []).length;
            }
        }
        saveProviders();
        populateModelSelects(); 
        if (modelUsageSettings[currentDisplayedTaskType]?.startsWith(provider.id + '/')) {
            updateActiveTaskModelDisplay(currentDisplayedTaskType);
        }
    });

    providerListDiv.addEventListener('click', async (event) => {
        const target = event.target;
        const providerItem = target.closest('.provider-item');
        if (!providerItem) return;

        const providerIdFromElement = providerItem.dataset.providerId;
        const providerIndex = providers.findIndex(p => p.id === providerIdFromElement);

        if (providerIndex === -1) return;
        const provider = providers[providerIndex];
        if (!provider) return;
        
        const providerItemElement = target.closest('.provider-item');

        if (target.closest('.config-item-header')) {
            const clickedProviderId = providerItemElement.dataset.providerId;
            const clickedProviderIndex = providers.findIndex(p => p.id === clickedProviderId);
            if (clickedProviderIndex !== -1) {
                providers[clickedProviderIndex].isCollapsed = !providers[clickedProviderIndex].isCollapsed;
                saveProviders();
                renderProviders(); 
            }
        } else if (target.classList.contains('provider-model-select-trigger')) {
            const dropdownWrapper = providerItemElement.querySelector('.provider-available-models-select');
            if (dropdownWrapper) {
                const currentlyOpen = dropdownWrapper.classList.contains('open');
                document.querySelectorAll('.provider-available-models-select.open').forEach(openDropdown => {
                    if (openDropdown !== dropdownWrapper) {
                        openDropdown.classList.remove('open');
                    }
                });
                dropdownWrapper.classList.toggle('open', !currentlyOpen); 
                if (dropdownWrapper.classList.contains('open')) {
                    const searchInput = dropdownWrapper.querySelector('.provider-model-search-input');
                    if (searchInput) {
                         searchInput.value = ''; 
                         const list = dropdownWrapper.querySelector('.provider-model-options-list');
                         if (list) Array.from(list.children).forEach(li => li.style.display = '');
                         searchInput.focus();
                    }
                }
            }
        } else if (target.classList.contains('fetch-provider-models')) {
            const fetchProviderId = providerItemElement.dataset.providerId; // Use correct ID
            const fetchProviderIndex = providers.findIndex(p => p.id === fetchProviderId);
            if (fetchProviderIndex === -1) return;
            const currentProvider = providers[fetchProviderIndex]; // Use correct provider object

            if (!currentProvider.baseURL || !currentProvider.apiKey) {
                alert('请先为此提供商填写 Base URL 和 API Key。');
                return;
            }
            target.disabled = true;
            target.textContent = '获取中...';
            try {
                const response = await fetch(`${currentProvider.baseURL}/v1/models`, { // Use currentProvider.baseURL
                    headers: { 'Authorization': `Bearer ${currentProvider.apiKey}` } // Use currentProvider.apiKey
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`获取模型列表失败: ${response.status} ${response.statusText} - ${errorData.error?.message || '未知API错误'}`);
                }
                const data = await response.json();
                currentProvider.availableModels = (data.data || []).map(m => ({ id: m.id, name: m.name || m.id }));
                currentProvider.enabledModelIds = []; 
                saveProviders();
                renderProviders(); 
                alert(`为 "${currentProvider.name || `提供商 #${fetchProviderIndex + 1}`}" 成功获取 ${currentProvider.availableModels.length} 个模型。请在列表中手动勾选需要启用的模型。`);
            } catch (error) {
                console.error('获取模型列表时出错:', error);
                alert(`获取模型列表失败: ${error.message}`);
            } finally {
                target.disabled = false;
                target.textContent = '获取模型列表';
            }
        } else if (target.classList.contains('update-manual-models')) {
            const textarea = providerItem.querySelector('.manual-model-ids');
            if (textarea) {
                provider.manualModelIds = textarea.value.split('\n').map(id => id.trim()).filter(id => id);
                if(!provider.enabledModelIds) provider.enabledModelIds = [];
                provider.manualModelIds.forEach(manualId => {
                    if(!provider.enabledModelIds.includes(manualId)) provider.enabledModelIds.push(manualId);
                });
                saveProviders();
                renderProviders(); 
                alert('手动模型ID已更新。');
            }
        } else if (target.classList.contains('remove-provider')) {
            if (confirm(`确定要移除 "${provider.name || `提供商 #${providerIndex + 1}`}" 吗？`)) {
                const removedProviderId = provider.id;
                providers.splice(providerIndex, 1);
                Object.keys(modelUsageSettings).forEach(taskType => {
                    if (modelUsageSettings[taskType] && modelUsageSettings[taskType].startsWith(removedProviderId + '/')) {
                        modelUsageSettings[taskType] = null; 
                    }
                });
                saveProviders();
                saveModelUsageSettings();
                renderProviders();
                loadModelUsage(); 
            }
        }
    });
}


// 模型使用选择事件
if (saveModelUsageButton) {
    saveModelUsageButton.addEventListener('click', saveModelUsage);
}

let currentDisplayedTaskType = 'personnel'; 


// DeepSeek 快速配置
if (quickConfigDeepseekButton) {
    quickConfigDeepseekButton.addEventListener('click', () => {
        const apiKey = deepseekApiKeyInput.value.trim();
        if (!apiKey) {
            alert('请输入 DeepSeek API Key。');
            return;
        }

        const deepSeekProviderId = 'provider-deepseek-quick';
        let deepseekProvider = providers.find(p => p.id === deepSeekProviderId);

        if (!deepseekProvider) {
            deepseekProvider = {
                id: deepSeekProviderId,
                name: 'DeepSeek (快速配置)',
                baseURL: 'https://api.deepseek.com',
                apiKey: apiKey,
                availableModels: [ 
                    { id: 'deepseek-chat', name: 'DeepSeek Chat' },
                    { id: 'deepseek-coder', name: 'DeepSeek Coder' } 
                ],
                manualModelIds: ['deepseek-reasoner'], 
                enabledModelIds: ['deepseek-chat', 'deepseek-reasoner'], 
                isCollapsed: false
            };
            providers.push(deepseekProvider);
        } else {
            deepseekProvider.apiKey = apiKey; 
            if(!deepseekProvider.enabledModelIds.includes('deepseek-chat')) deepseekProvider.enabledModelIds.push('deepseek-chat');
            if(!deepseekProvider.enabledModelIds.includes('deepseek-reasoner')) deepseekProvider.enabledModelIds.push('deepseek-reasoner');
            if(!deepseekProvider.manualModelIds.includes('deepseek-reasoner')) deepseekProvider.manualModelIds.push('deepseek-reasoner');
        }
        
        saveProviders();
        renderProviders();

        modelUsageSettings.personnel = `${deepSeekProviderId}/deepseek-chat`;
        modelUsageSettings.seating = `${deepSeekProviderId}/deepseek-reasoner`; 
        modelUsageSettings.seat_modification = `${deepSeekProviderId}/deepseek-chat`; 
        saveModelUsageSettings();
        loadModelUsage(); 

        alert('DeepSeek 模型已快速配置并选定用于相关任务！');
        deepseekApiKeyInput.value = '';
    });
}


// 页面加载时初始化
renderProviders();
loadModelUsage(); 


// 发送描述给 AI
sendDescriptionButton.addEventListener('click', async () => {
    const description = personDescriptionInput.value.trim();
    const personnelTaskConfig = getModelConfig('personnel');

    if (!personnelTaskConfig) {
        alert('请在侧边栏"使用模型选择"中为"信息整理"任务选择一个模型。');
        return;
    }
    if (!personnelTaskConfig.baseURL || !personnelTaskConfig.modelId || !personnelTaskConfig.apiKey) {
        alert('选择的"信息整理"模型配置不完整 (缺少Base URL, Model ID, 或 API Key)。请检查提供商配置。');
        return;
    }

    if (!description) {
        alert('请输入人物描述。');
        return;
    }

    loadingIndicator.style.display = 'block';
    markdownOutputDiv.innerHTML = ''; 
    sendDescriptionButton.disabled = true;

    if (personnelThinkingOutputDiv && personnelThinkingPre) {
        personnelThinkingPre.textContent = '';
        personnelThinkingOutputDiv.classList.remove('thinking-output-visible');
    }

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

    if (conversationHistory.length === 0) {
        conversationHistory.push({ role: 'system', content: systemPrompt });
    }

    const userMessage = { role: 'user', content: `<人物描述>\n${description}\n</人物描述>` };
    conversationHistory.push(userMessage);
    let storedDescriptions = JSON.parse(localStorage.getItem('user_descriptions') || '[]');
    storedDescriptions.push(description);
    localStorage.setItem('user_descriptions', JSON.stringify(storedDescriptions));

    try {
    const response = await fetch(`${personnelTaskConfig.baseURL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${personnelTaskConfig.apiKey}`
        },
        body: JSON.stringify({
            model: personnelTaskConfig.modelId, // 使用原始 modelId
            messages: conversationHistory,
            stream: true,
            temperature: 0.35
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: '无法解析错误响应' } }));
        throw new Error(`API 请求失败: ${response.status} ${response.statusText} - ${errorData.error?.message || '未知API错误'}`);
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
                    if (jsonData === '[DONE]') break;
                    try {
                        const parsedData = JSON.parse(jsonData);
                        const delta = parsedData.choices[0]?.delta;
                        const reasoningContent = delta?.reasoning_content || delta?.reasoning; 
                        const outputContent = delta?.content;

                        if (reasoningContent && personnelThinkingOutputDiv && personnelThinkingPre) {
                            personnelThinkingPre.textContent += reasoningContent;
                            if (personnelThinkingPre.textContent.trim() !== '') {
                                personnelThinkingOutputDiv.classList.add('thinking-output-visible');
                            } else {
                                personnelThinkingOutputDiv.classList.remove('thinking-output-visible');
                            }
                        }

                        if (outputContent) {
                            fullResponse += outputContent; 
                            if (fullResponse.includes('<changes>')) {
                                if (personnelThinkingOutputDiv && personnelThinkingPre.textContent.trim() === '' && !reasoningContent) { 
                                     personnelThinkingOutputDiv.classList.remove('thinking-output-visible');
                                }
                                const changesBlockMatch = fullResponse.match(/<changes>([\s\S]*)/i);
                                if (changesBlockMatch) {
                                    markdownOutputDiv.textContent = changesBlockMatch[1].replace(/<\/changes>[\s\S]*/i, '');
                                }
                            } else if (!reasoningContent) { 
                                accumulatedContent += outputContent; 
                                markdownOutputDiv.textContent = accumulatedContent; 
                            }
                        }
                    } catch (e) {
                        console.error('解析人员信息 SSE 数据块时出错:', e, '数据块:', jsonData);
                    }
                }
            }
             if (typeof jsonData !== 'undefined' && jsonData === '[DONE]') break;
        }

        const changesMatch = fullResponse.match(/<changes>([\s\S]*?)<\/changes>/i); // Use fullResponse
        if (changesMatch && changesMatch[1]) {
            const changesContent = changesMatch[1].trim();
            if (changesContent && changesContent !== '没有变化') {
                updatePersonnelTable(changesContent);
            } else if (changesContent === '没有变化') {
                console.log('AI 表示没有需要更新的人员信息。');
            } else {
                console.warn('AI 返回的变化信息为空:', fullResponse);
            }
            conversationHistory.push({ role: 'assistant', content: fullResponse });
        } else {
            if (fullResponse.includes('没有变化') || fullResponse.includes('无需更新')) {
                console.log('AI 表示没有需要更新的人员信息（未找到<changes>标签）。');
            } else {
                console.error('未能从 AI 响应中提取变化信息 (无<changes>标签): ', fullResponse);
                conversationHistory.pop(); 
                if(conversationHistory.length > 0 && conversationHistory[conversationHistory.length-1].role === 'system') {
                    conversationHistory.pop(); 
                }
            }
            if (!(fullResponse.includes('没有变化') || fullResponse.includes('无需更新'))) {
                conversationHistory.push({ role: 'assistant', content: fullResponse });
            }
        }
        renderPersonnelTable();

    } catch (error) {
        console.error('调用 API 时出错:', error);
        markdownOutputDiv.innerHTML = `<p style="color: red;">发生错误: ${error.message}</p>`;
        conversationHistory.pop();
        if(conversationHistory.length > 0 && conversationHistory[conversationHistory.length-1].role === 'system') {
            conversationHistory.pop();
        }
    } finally {
        loadingIndicator.style.display = 'none';
        sendDescriptionButton.disabled = false;
        renderPersonnelTable();
        if (personnelThinkingOutputDiv && personnelThinkingPre && personnelThinkingPre.textContent.trim() === '') {
            personnelThinkingOutputDiv.classList.remove('thinking-output-visible');
        }
    }
});

// Event listener for clearing the personnel table
clearPersonnelTableButton.addEventListener('click', () => {
    personnelData = [];
    localStorage.removeItem('personnel_data');
    localStorage.removeItem('user_descriptions'); 
    conversationHistory = []; 
    renderPersonnelTable();
    alert('人员信息表已清除。');
});

// 函数：更新人员信息表格（处理AI返回的修改）
function updatePersonnelTable(markdownDiff) {
    const changesLines = markdownDiff.split('\n').map(line => line.trim()).filter(line => line !== ''); 

    changesLines.forEach(line => {
        if (line.startsWith('[新增]')) {
            const markdownLine = line.substring('[新增]'.length).trim();
            const person = parseMarkdownTableRow(markdownLine);
            if (person && person['人物']) {
                personnelData.push(person);
            }
        } else if (line.startsWith('[修改]')) {
            const markdownLine = line.substring('[修改]'.length).trim();
            const updatedPerson = parseMarkdownTableRow(markdownLine);
            if (updatedPerson && updatedPerson['人物']) {
                const existingPersonIndex = personnelData.findIndex(p => p['人物'] === updatedPerson['人物']);
                if (existingPersonIndex !== -1) {
                    personnelData[existingPersonIndex] = updatedPerson;
                } else {
                     personnelData.push(updatedPerson); // If not found, add as new
                }
            }
        } else if (line.startsWith('[删除]')) {
            const personName = line.substring('[删除]'.length).trim();
            if (personName) {
                personnelData = personnelData.filter(p => p['人物'] !== personName);
            }
        }
    });
    renderPersonnelTable();
}

// 辅助函数：解析单行 Markdown 表格数据为对象
function parseMarkdownTableRow(markdownLine) {
    const values = markdownLine.split('|').map(v => v.trim()).filter(v => v);
    if (values.length >= 3) {
        const person = {};
        person['人物'] = values[0];
        person['性别'] = values[1];
        person['备注'] = values.slice(2).join(' | ').trim(); 
        return person;
    }
    return null; 
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


// 函数：统一渲染人员表格并保存到 localStorage
function renderPersonnelTable() {
    const isCollapsed = outputSection && outputSection.classList.contains('personnel-collapsed');
    const markdownForStorage = personnelDataToMarkdown(personnelData); 

    if (isCollapsed) {
        let listHtml = '';
        if (personnelData.length > 0) {
            personnelData.forEach(person => {
                const tooltipText = `性别: ${person.性别 || '未知'}\n备注: ${person.备注 || '无'}`;
                const escapedTooltipText = tooltipText.replace(/"/g, '"').replace(/'/g, '&#39;');
                listHtml += `<div class="personnel-item" data-tooltip="${escapedTooltipText}">${person.人物 || '未知姓名'}</div>`;
            });
        } else {
            listHtml = '<div class="personnel-item-empty">无人员</div>';
        }
        markdownOutputDiv.innerHTML = listHtml;
    } else {
        let htmlTable = '<table><thead><tr><th>人物</th><th>性别</th><th>备注</th></tr></thead><tbody>';
        if (personnelData.length > 0) {
            personnelData.forEach(person => {
                const tooltipText = `性别: ${person.性别 || '未知'}\n备注: ${person.备注 || '无'}`;
                const escapedTooltipText = tooltipText.replace(/"/g, '"').replace(/'/g, '&#39;');
                htmlTable += `<tr>
                                <td data-tooltip="${escapedTooltipText}">${person.人物 || ''}</td>
                                <td>${person.性别 || ''}</td>
                                <td>${person.备注 || ''}</td>
                              </tr>`;
            });
        } else {
            htmlTable += '<tr><td colspan="3">暂无人员信息</td></tr>';
        }
        htmlTable += '</tbody></table>';
        markdownOutputDiv.innerHTML = htmlTable;
    }

    localStorage.setItem('personnel_data', JSON.stringify(personnelData));
    localStorage.setItem('current_personnel_markdown', markdownForStorage);
}


// 函数：将 Markdown 表格转换为人员数据数组
function markdownToPersonnelData(markdown) {
    const lines = markdown.split('\n').map(line => line.trim()).filter(line => line.startsWith('|') && line.endsWith('|'));
    if (lines.length < 2) return []; 
    
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

// Helper function to generate empty seat table markdown
function generateEmptySeatTableMarkdown(rows, cols, deskMates) {
    if (rows < 1 || cols < 1 || deskMates < 1) {
        console.error('行数、列数和同桌数必须大于0。');
        return ""; 
    }
    if (deskMates > cols) {
        console.error('同桌数不能大于列数。');
        return "";
    }

    let markdownTable = '';
    const totalSeats = rows * cols;
    const groupSize = deskMates;
    const groupsPerRow = Math.floor(cols / groupSize);
    const remainderSeats = cols % groupSize;

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
                rowMarkdown += `  |`; 
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
    return markdownTable;
}

// 函数：动态生成和预览座位表 (替换旧的 generateTableButton 逻辑)
function dynamicGenerateAndPreviewTable() {
    const rows = parseInt(rowsInput.value);
    const cols = parseInt(colsInput.value);
    const deskMates = parseInt(deskMatesInput.value);

    if (rows < 1 || cols < 1 || deskMates < 1) {
        tablePreviewDiv.innerHTML = '<p style="color: #aaa;">请输入有效的行数、列数和同桌数。</p>';
        closeSeatModificationDialog(); // 确保在无效输入时也隐藏
        return;
    }
    if (deskMates > cols) {
        tablePreviewDiv.innerHTML = '<p style="color: red;">同桌数不能大于列数。</p>';
        closeSeatModificationDialog(); // 确保在无效输入时也隐藏
        return;
    }

    const markdownTable = generateEmptySeatTableMarkdown(rows, cols, deskMates);
    if (!markdownTable) {
        tablePreviewDiv.innerHTML = '<p style="color: red;">无法生成座位表预览。</p>';
        closeSeatModificationDialog();
        return;
    }

    tablePreviewDiv.innerHTML = marked.parse(markdownTable);
    localStorage.setItem('seat_table_markdown', markdownTable); 
    localStorage.setItem('original_seat_format_markdown', markdownTable); 
    localStorage.removeItem('arranged_seat_table_markdown'); 

    closeSeatModificationDialog(); // 使用新的函数来隐藏细微调整部分及其按钮
    if (seatModificationInput) seatModificationInput.value = ''; 
    if (seatModificationOutput) { 
        seatModificationOutput.innerHTML = '';
        seatModificationOutput.style.display = 'none';
    }
    seatModificationConversationHistory = []; 
}

// 为行数、列数、同桌数输入框添加事件监听器
rowsInput.addEventListener('input', dynamicGenerateAndPreviewTable);
colsInput.addEventListener('input', dynamicGenerateAndPreviewTable);
deskMatesInput.addEventListener('input', dynamicGenerateAndPreviewTable);

// 页面加载时也尝试生成一次，以防有默认值
document.addEventListener('DOMContentLoaded', () => {
    dynamicGenerateAndPreviewTable(); 
    closeSeatModificationDialog(); 
    
    // Function to sync heights of personnel info sections with table generator section
    function syncSectionHeights() {
        const tableGeneratorSection = document.querySelector('.table-generator-section');
        // const inputSec = document.querySelector('.input-section');  // 不再需要同步 input-section
        const outputSecElement = document.querySelector('.output-section');
        
        if (!tableGeneratorSection) return;
        const targetHeight = tableGeneratorSection.offsetHeight;

        // if (inputSec) inputSec.style.minHeight = `${targetHeight}px`; // 移除对 input-section 高度的设置
        
        if (outputSecElement) { // outputSectionElement is the .output-section div
            // Always set its height to match tableGeneratorSection
            outputSecElement.style.height = `${targetHeight}px`;
            // If it's collapsed, its internal wrapper might need specific handling if desired
            // but for now, just ensuring the main output-section matches height.
        }
    }

    setTimeout(syncSectionHeights, 150);
    window.addEventListener('resize', () => setTimeout(syncSectionHeights, 50));
    if (document.readyState === 'complete') {
        setTimeout(syncSectionHeights, 500);
    } else {
        window.addEventListener('load', () => setTimeout(syncSectionHeights, 200));
    }
    if (togglePersonnelListButton) {
        togglePersonnelListButton.addEventListener('click', () => setTimeout(syncSectionHeights, 50));
    }
    const tableGenSectionForObserver = document.querySelector('.table-generator-section');
    if (tableGenSectionForObserver) {
        const observer = new MutationObserver(syncSectionHeights);
        observer.observe(tableGenSectionForObserver, { childList: true, subtree: true, attributes: true, characterData: true });
    }
});


// AI 智能编排座位
const aiArrangeButton = document.getElementById('ai-arrange-button'); // 确保这是正确的按钮ID
const arrangementRemarksInput = document.getElementById('arrangement-remarks');

// Thinking output elements
const aiThinkingOutputDiv = document.getElementById('ai-thinking-output'); 
const aiThinkingPre = aiThinkingOutputDiv ? aiThinkingOutputDiv.querySelector('pre') : null;

const personnelThinkingOutputDiv = document.querySelector('.personnel-thinking-output');
const personnelThinkingPre = personnelThinkingOutputDiv ? personnelThinkingOutputDiv.querySelector('pre') : null;

const seatModifyThinkingOutputDiv = document.querySelector('.seat-modify-thinking-output');
const seatModifyThinkingPre = seatModifyThinkingOutputDiv ? seatModifyThinkingOutputDiv.querySelector('pre') : null;


// AI 智能编排座位
aiArrangeButton.addEventListener('click', async () => {
    const remarks = arrangementRemarksInput.value.trim();
    const personnelTable = personnelDataToMarkdown(personnelData); 
    
    const currentRows = parseInt(rowsInput.value);
    const currentCol = parseInt(colsInput.value);
    const currentDeskMates = parseInt(deskMatesInput.value);

    if (currentRows < 1 || currentCol < 1 || currentDeskMates < 1) {
        alert('AI编排前，请确保行数、列数和同桌数均大于0。');
        return;
    }
    if (currentDeskMates > currentCol) {
        alert('AI编排前，请确保同桌数不大于列数。');
        return;
    }

    const currentEmptyTableMarkdown = generateEmptySeatTableMarkdown(currentRows, currentCol, currentDeskMates);
    if (!currentEmptyTableMarkdown) {
        alert('无法生成座位表结构，请检查行列及同桌数设置。');
        return;
    }
    localStorage.setItem('original_seat_format_markdown', currentEmptyTableMarkdown);
    const seatTableFormat = currentEmptyTableMarkdown; 

    const seatingTaskConfig = getModelConfig('seating');

    if (!seatingTaskConfig) {
        alert('请在侧边栏"使用模型选择"中为"座位表生成"任务选择一个模型。');
        return;
    }
    if (!seatingTaskConfig.baseURL || !seatingTaskConfig.modelId || !seatingTaskConfig.apiKey) {
        alert('选择的"座位表生成"模型配置不完整。请检查提供商配置。');
        return;
    }

    if (!personnelTable || personnelTable.trim() === '') {
        alert('请先生成人员信息表。');
        return;
    }

    if (!seatTableFormat || seatTableFormat.trim() === '') { 
        alert('座位表格式为空，请先生成或检查设置。');
        return;
    }

    if (aiThinkingOutputDiv && aiThinkingPre) {
        aiThinkingPre.textContent = '';
        aiThinkingOutputDiv.classList.remove('thinking-output-visible');
    }
    
    if (tablePreviewDiv.innerHTML.trim() === '' || tablePreviewDiv.textContent.includes("请输入有效") || tablePreviewDiv.textContent.includes("无法生成")) {
        dynamicGenerateAndPreviewTable(); 
        if (tablePreviewDiv.innerHTML.trim() === '' || tablePreviewDiv.textContent.includes("请输入有效") || tablePreviewDiv.textContent.includes("无法生成")) {
             alert('AI编排前，请确保行数、列数和同桌数设置有效。');
             return;
        }
    }
    let seatTableFormatToUse = localStorage.getItem('original_seat_format_markdown');
    if (!seatTableFormatToUse) {
        dynamicGenerateAndPreviewTable();
        seatTableFormatToUse = localStorage.getItem('original_seat_format_markdown');
        if (!seatTableFormatToUse) {
            alert('无法获取座位表格式，请检查行列及同桌数设置。');
            aiArrangeButton.disabled = false; 
            return;
        }
    }


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
${seatTableFormatToUse}
</座位表格式>
- 如果我提供的人物表中的人数不足以填满座位表，请在表格中用"空座位"替代。
- 如果我提供的人物表中的人数超过了座位表的座位数，并没有被编排进去的人请在表格中用"人物（未被编排）"注明。
请在<编排好的座位表>标签内输出修改后的表格。
`;

    try {
        const response = await fetch(`${seatingTaskConfig.baseURL}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${seatingTaskConfig.apiKey}`
            },
            body: JSON.stringify({
                model: seatingTaskConfig.modelId, 
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: '请根据我提供的信息开始编排座位。' }
                ],
                stream: true
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: { message: '无法解析错误响应' } }));
            throw new Error(`API 请求失败: ${response.status} ${response.statusText} - ${errorData.error?.message || '未知API错误'}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulatedContent = '';
        let thinkingContent = '';
        
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
                        const delta = parsedData.choices[0]?.delta;
                        const reasoningContent = delta?.reasoning_content || delta?.reasoning; 
                        const outputContent = delta?.content;
                        
                        if (reasoningContent && aiThinkingOutputDiv && aiThinkingPre) {
                            thinkingContent += reasoningContent;
                            aiThinkingPre.textContent = thinkingContent;
                            aiThinkingPre.scrollTop = aiThinkingPre.scrollHeight;
                            if (thinkingContent.trim() !== '') {
                                aiThinkingOutputDiv.classList.add('thinking-output-visible');
                            } else {
                                aiThinkingOutputDiv.classList.remove('thinking-output-visible');
                            }
                        }
                        
                        if (outputContent) {
                            accumulatedContent += outputContent; 
                            const tableStartTag = "<编排好的座位表>";
                            const tableEndTag = "</编排好的座位表>";
                            let currentTableSegment = "";
                            if (accumulatedContent.includes(tableStartTag)) {
                                let startIndex = accumulatedContent.indexOf(tableStartTag) + tableStartTag.length;
                                let endIndex = accumulatedContent.indexOf(tableEndTag);
                                currentTableSegment = endIndex === -1 ? accumulatedContent.substring(startIndex) : accumulatedContent.substring(startIndex, endIndex);
                                
                                if (currentTableSegment.trim() && currentTableSegment.includes("|")) {
                                    tablePreviewDiv.innerHTML = marked.parse(currentTableSegment);
                                    applyGenderColoring(); 
                                    displayOriginalSeatNumbers(); 
                                }
                            }
                        }
                    } catch (e) {
                        console.error('解析 SSE 数据块时出错:', e, '数据块:', jsonData);
                    }
                }
            }
            if (typeof jsonData !== 'undefined' && jsonData === '[DONE]') break;
        }

        const tableStartTag = "<编排好的座位表>";
        const tableEndTag = "</编排好的座位表>";
        let finalTableMarkdown = "";
        const startIndex = accumulatedContent.indexOf(tableStartTag);
        const endIndex = accumulatedContent.indexOf(tableEndTag, startIndex);

        if (startIndex !== -1 && endIndex !== -1) {
            finalTableMarkdown = accumulatedContent.substring(startIndex + tableStartTag.length, endIndex).trim();
        } else if (startIndex !== -1) { 
            finalTableMarkdown = accumulatedContent.substring(startIndex + tableStartTag.length).trim();
        }
        if (!finalTableMarkdown) {
            const tableMatchRegex = accumulatedContent.match(/(\|.*\|[\s]*)+/);
            if (tableMatchRegex) {
                finalTableMarkdown = tableMatchRegex[0].trim();
            }
        }

        if (finalTableMarkdown) {
            tablePreviewDiv.innerHTML = marked.parse(finalTableMarkdown);
            applyGenderColoring();
            displayOriginalSeatNumbers();
            localStorage.setItem('arranged_seat_table_markdown', finalTableMarkdown);
            if (aiThinkingOutputDiv && (!thinkingContent || thinkingContent.trim() === '')) {
                aiThinkingOutputDiv.classList.remove('thinking-output-visible');
            }
            openSeatModificationDialog();
        } else {
            tablePreviewDiv.innerHTML = '<p>AI 未能按预期格式返回编排好的座位表。</p>';
            if (aiThinkingOutputDiv && thinkingContent && thinkingContent.trim() !== '') {
                aiThinkingOutputDiv.classList.add('thinking-output-visible');
            }
        }

    } catch (error) {
        console.error('调用 API 进行座位编排时出错:', error);
        tablePreviewDiv.innerHTML = `<p style="color: red;">座位编排失败: ${error.message}</p>`;
        if (aiThinkingOutputDiv && aiThinkingPre) {
            aiThinkingPre.textContent += `\n\n错误: ${error.message}`;
            aiThinkingOutputDiv.classList.add('thinking-output-visible'); 
        }
    } finally {
        aiArrangeButton.disabled = false;
        if (aiThinkingOutputDiv && aiThinkingPre && aiThinkingPre.textContent.trim() === '') {
            aiThinkingOutputDiv.classList.remove('thinking-output-visible');
        }
    }
});

// 应用性别着色
function applyGenderColoring() {
    if (!personnelData || personnelData.length === 0) return;
    const tableElement = tablePreviewDiv.querySelector('table');
    if (!tableElement) return;

    const genderMap = {};
    personnelData.forEach(person => {
        if (person['人物'] && person['性别']) {
            genderMap[person['人物']] = person['性别'];
        }
    });

    const cells = tableElement.querySelectorAll('td');
    cells.forEach(cell => {
        cell.style.backgroundColor = ''; 
        const name = cell.textContent.trim();
        const nameWithoutStatus = name.replace(/\s*（未被编排）$/, '').trim();

        if (genderMap[nameWithoutStatus]) {
            if (genderMap[nameWithoutStatus].includes('男')) cell.style.backgroundColor = '#e6f3ff';
            else if (genderMap[nameWithoutStatus].includes('女')) cell.style.backgroundColor = '#ffe6f2';
        } else if (genderMap[name]) { 
             if (genderMap[name].includes('男')) cell.style.backgroundColor = '#e6f3ff';
             else if (genderMap[name].includes('女')) cell.style.backgroundColor = '#ffe6f2';
        }
    });
}

// Task 4: Display original seat numbers as background
function displayOriginalSeatNumbers() {
    const tableElement = tablePreviewDiv.querySelector('table');
    if (!tableElement) return;

    tableElement.querySelectorAll('.original-seat-number-bg').forEach(span => span.remove());

    const originalSeatFormatMarkdown = localStorage.getItem('original_seat_format_markdown');
    if (!originalSeatFormatMarkdown) { 
        console.warn("displayOriginalSeatNumbers: original_seat_format_markdown not found in localStorage.");
        return;
    }
    
    const originalFormatArray = markdownTableToArray(originalSeatFormatMarkdown);
    
    const tbody = tableElement.querySelector('tbody');
    if (!tbody) return;
    const dataRows = Array.from(tbody.rows); 

    dataRows.forEach((htmlRow, rowIndex) => {
        Array.from(htmlRow.cells).forEach((cell, cellIndex) => {
            const originalRowIndexInArray = rowIndex + 2; 

            if (originalFormatArray[originalRowIndexInArray] && originalFormatArray[originalRowIndexInArray][cellIndex] !== undefined) {
                const originalSeatPlaceholder = originalFormatArray[originalRowIndexInArray][cellIndex].trim();
                const currentCellContent = cell.textContent.trim();

                if (originalSeatPlaceholder && 
                    !originalSeatPlaceholder.toLowerCase().includes('走廊') && 
                    originalSeatPlaceholder.trim() !== '' &&
                    currentCellContent && 
                    currentCellContent.toLowerCase() !== '空座位' &&
                    currentCellContent !== originalSeatPlaceholder &&
                    !currentCellContent.toLowerCase().includes('走廊')) {
                    
                    const seatNumberMatch = originalSeatPlaceholder.match(/\d+/); 
                    if (seatNumberMatch) {
                        const originalNumber = seatNumberMatch[0];
                        const bgNumberSpan = document.createElement('span');
                        bgNumberSpan.classList.add('original-seat-number-bg');
                        bgNumberSpan.textContent = originalNumber;
                        if (getComputedStyle(cell).position === 'static') {
                            cell.style.position = 'relative';
                        }
                        cell.appendChild(bgNumberSpan);
                    }
                }
            }
        });
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

        const lines = markdown.split('\n');
        if (lines.length < 2 || !lines[0].includes('|') || !lines[1].includes('---')) {
            alert('Markdown格式似乎不正确，至少需要包含表头和分隔行。');
            return;
        }

        tablePreviewDiv.innerHTML = marked.parse(markdown);
        localStorage.setItem('arranged_seat_table_markdown', markdown); 
        localStorage.setItem('original_seat_format_markdown', markdown); 

        const { rows, cols, deskMates } = parseImportedTableStructure(markdown);
        if (rows && cols && deskMates) {
            rowsInput.value = rows;
            colsInput.value = cols;
            deskMatesInput.value = deskMates;
            alert(`座位表已成功导入并显示。检测到 ${rows} 行, ${cols} 列, ${deskMates} 同桌。`);
        } else {
            alert('座位表已成功导入并显示。未能自动识别行列同桌数，请手动检查。');
        }
        
        importSeatTableMarkdownTextarea.value = ''; 

        applyGenderColoring(); 
        displayOriginalSeatNumbers(); 
        openSeatModificationDialog();
    });
}

// 函数：尝试从导入的Markdown表格解析结构
function parseImportedTableStructure(markdown) {
    const lines = markdown.trim().split('\n');
    if (lines.length < 3) return {}; // 至少需要表头、分隔符、数据行

    const headerLine = lines[0].trim();
    const dataLines = lines.slice(2).filter(line => line.trim().startsWith('|') && line.trim().endsWith('|'));
    
    if (dataLines.length === 0) return {};

    const numRows = dataLines.length;
    let numCols = 0; // 实际座位列数
    let deskMates = 1; // 默认同桌数为1

    // 解析表头以确定列数和同桌数
    const headerCells = headerLine.slice(1, -1).split('|').map(cell => cell.trim().toLowerCase());
    
    let currentGroup = [];
    const deskMateGroups = [];

    for (const cell of headerCells) {
        if (cell.includes('座位') && cell.trim() !== '') {
            numCols++; // 只计算包含“座位”的列为有效座位列
            currentGroup.push(cell);
        } else if (cell.includes('走廊') || cell.trim() === '') {
            if (currentGroup.length > 0) {
                deskMateGroups.push(currentGroup.length);
            }
            currentGroup = []; // 遇到走廊或空单元格，重置当前组
        } else { // 其他非空非走廊的单元格也视为座位列的一部分
            numCols++;
            currentGroup.push(cell);
        }
    }
    if (currentGroup.length > 0) { // 处理最后一组
        deskMateGroups.push(currentGroup.length);
    }

    if (deskMateGroups.length > 0) {
        // 取最常见的组大小作为同桌数
        const groupCounts = {};
        let maxCount = 0;
        deskMateGroups.forEach(groupSize => {
            groupCounts[groupSize] = (groupCounts[groupSize] || 0) + 1;
            if (groupCounts[groupSize] > maxCount) {
                maxCount = groupCounts[groupSize];
                deskMates = groupSize;
            }
        });
    } else if (numCols > 0 && numRows > 0) { // 如果没有明确的走廊分组，但有座位列
        deskMates = numCols; // 假设所有列都是一个大组（这种情况可能不常见）
    }


    // 如果通过表头无法有效确定列数，则尝试通过数据行确定（作为后备）
    if (numCols === 0 && dataLines.length > 0) {
        const firstDataRowCells = dataLines[0].slice(1, -1).split('|');
        numCols = firstDataRowCells.filter(cell => cell.trim() !== '').length; // 计算非空数据单元格数量
        // 这种情况下，同桌数更难确定，默认为1或整个行
        deskMates = numCols > 0 ? 1 : 1; // 默认为1，除非只有一列则为1
    }
    
    // 确保 deskMates 不为0，并且不超过 numCols
    if (deskMates === 0 && numCols > 0) deskMates = 1;
    if (deskMates > numCols && numCols > 0) deskMates = numCols;


    return { rows: numRows, cols: numCols, deskMates: deskMates };
}

// Function to open/show the seat modification dialog/section
function openSeatModificationDialog() {
    if (seatModificationSection) {
        seatModificationSection.style.display = 'flex'; 
        const sendButton = document.getElementById('send-seat-modification-button'); // 获取按钮
        if (sendButton) {
            sendButton.style.display = 'inline-block'; 
        }
        if (seatModificationInput) seatModificationInput.value = ''; 
        if (seatModificationOutput) {
            seatModificationOutput.innerHTML = ''; 
            seatModificationOutput.style.display = 'none';
        }
        seatModificationConversationHistory = []; 
    }
}

// Function to hide the seat modification dialog/section and button
function closeSeatModificationDialog() {
    if (seatModificationSection) {
        seatModificationSection.style.display = 'none'; 
    }
    const sendButton = document.getElementById('send-seat-modification-button'); // 获取按钮
    if (sendButton) {
        sendButton.style.display = 'none'; 
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
        let currentSeatTable = localStorage.getItem('arranged_seat_table_markdown');
        const originalSeatFormat = localStorage.getItem('original_seat_format_markdown') || "";

        if (!currentSeatTable || currentSeatTable.trim() === "") {
            currentSeatTable = originalSeatFormat;
            if (tablePreviewDiv.innerHTML.trim() === "" && originalSeatFormat) {
                 tablePreviewDiv.innerHTML = marked.parse(originalSeatFormat);
            }
        }
        
        let seatMappingInfo = "原始座位与当前内容的对应关系如下 (用于帮助您理解当前占用情况):\n";
        const originalFormatArrayForMapping = markdownTableToArray(originalSeatFormat);
        const currentSeatTableArrayForMapping = markdownTableToArray(currentSeatTable);

        if (originalFormatArrayForMapping.length > 0 && currentSeatTableArrayForMapping.length > 0 && originalFormatArrayForMapping.length === currentSeatTableArrayForMapping.length) {
            for (let r = 0; r < originalFormatArrayForMapping.length; r++) {
                if (r === 0 || originalFormatArrayForMapping[r].some(cell => cell.includes('---'))) continue;
                for (let c = 0; c < originalFormatArrayForMapping[r].length; c++) {
                    const originalSeatPlaceholder = originalFormatArrayForMapping[r][c];
                    const currentSeatContent = currentSeatTableArrayForMapping[r] ? (currentSeatTableArrayForMapping[r][c] || '未知') : '未知';
                    if (originalSeatPlaceholder && !originalSeatPlaceholder.trim().toLowerCase().includes('走廊') && originalSeatPlaceholder.trim() !== '') { 
                        seatMappingInfo += `- ${originalSeatPlaceholder.trim()}: 当前是 "${currentSeatContent.trim()}"\n`;
                    }
                }
            }
        } else {
            seatMappingInfo = "无法生成详细的座位映射信息，请主要参考下方提供的<当前座位表>。\n";
        }


        const seatModificationTaskConfig = getModelConfig('seat_modification');
        if (!seatModificationTaskConfig) {
            alert('请在侧边栏"使用模型选择"中为"座位微调"任务选择一个模型。');
            return;
        }
        if (!seatModificationTaskConfig.baseURL || !seatModificationTaskConfig.modelId || !seatModificationTaskConfig.apiKey) {
            alert('选择的"座位微调"模型配置不完整。请检查提供商配置。');
            return;
        }

        if (seatModificationLoading) seatModificationLoading.style.display = 'block';
        if (seatModificationOutput) {
            seatModificationOutput.innerHTML = ''; 
            seatModificationOutput.style.display = 'none'; 
        }
        if (seatModifyThinkingOutputDiv && seatModifyThinkingPre) {
            seatModifyThinkingPre.textContent = '';
            seatModifyThinkingOutputDiv.classList.remove('thinking-output-visible');
        }
        sendSeatModificationButton.disabled = true;

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
请您在处理用户指令时，务必参考此对应列表来确定用户所说的"座位X"当前具体是哪位人员或什么状态。
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
        
        seatModificationConversationHistory.push({ role: 'user', content: modificationInstruction });
        const messagesForAPI = [
            { role: 'system', content: systemPromptForSeatModification },
            ...seatModificationConversationHistory 
        ];

        try {
            const response = await fetch(`${seatModificationTaskConfig.baseURL}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${seatModificationTaskConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: seatModificationTaskConfig.modelId, 
                    messages: messagesForAPI,
                    stream: true 
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: { message: '无法解析错误响应' } }));
                throw new Error(`API 请求失败: ${response.status} ${response.statusText} - ${errorData.error?.message || '未知API错误'}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let accumulatedResponse = "";
            let thinkingPart = ""; 
            
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
                            const delta = parsedData.choices[0]?.delta;
                            const reasoningContent = delta?.reasoning_content || delta?.reasoning; 
                            const outputContent = delta?.content;

                            if (reasoningContent && seatModifyThinkingOutputDiv && seatModifyThinkingPre) {
                                thinkingPart += reasoningContent;
                                seatModifyThinkingPre.textContent = thinkingPart;
                                if (thinkingPart.trim() !== '') {
                                    seatModifyThinkingOutputDiv.classList.add('thinking-output-visible');
                                } else {
                                    seatModifyThinkingOutputDiv.classList.remove('thinking-output-visible');
                                }
                            }
                            if (outputContent) accumulatedResponse += outputContent; 
                        } catch (e) { console.error('解析修改座位SSE数据块时出错:', e, '数据块:', jsonData); }
                    }
                }
                 if (typeof jsonData !== 'undefined' && jsonData === '[DONE]') break;
            }
            
            seatModificationConversationHistory.push({ role: 'assistant', content: accumulatedResponse }); 
            
            const originalFormatForProcessing = localStorage.getItem('original_seat_format_markdown') || "";
            let currentArrangedTableForProcessing = localStorage.getItem('arranged_seat_table_markdown');
            if (!currentArrangedTableForProcessing || currentArrangedTableForProcessing.trim() === "") {
                currentArrangedTableForProcessing = originalFormatForProcessing;
            }

            const { newSeatTableMarkdown, changesSummary } = processSeatChanges(accumulatedResponse, currentArrangedTableForProcessing, originalFormatForProcessing);

            if (newSeatTableMarkdown) {
                tablePreviewDiv.innerHTML = marked.parse(newSeatTableMarkdown); 
                localStorage.setItem('arranged_seat_table_markdown', newSeatTableMarkdown); 
                applyGenderColoring();
                displayOriginalSeatNumbers(); 
                if (seatModificationOutput) {
                    seatModificationOutput.innerHTML = `<strong>已应用修改:</strong><br><pre>${changesSummary}</pre>`;
                }
            } else if (changesSummary) { 
                 if (seatModificationOutput) {
                    let styledChangesSummary = '';
                    if (changesSummary) {
                        const lines = changesSummary.split('\n');
                        styledChangesSummary = lines.map(line => {
                            line = line.replace(/</g, "<").replace(/>/g, ">"); 
                            if (line.startsWith('[SWAP]')) return `<span class="seat-mod-command seat-mod-swap">${line}</span>`;
                            if (line.startsWith('[MOVE]')) return `<span class="seat-mod-command seat-mod-move">${line}</span>`;
                            if (line.startsWith('[EMPTY]')) return `<span class="seat-mod-command seat-mod-empty">${line}</span>`;
                            if (line.startsWith('[FILL]')) return `<span class="seat-mod-command seat-mod-fill">${line}</span>`;
                            if (line.toLowerCase().includes('[错误]') || line.toLowerCase().includes('[error]')) return `<span class="seat-mod-error">${line}</span>`;
                            if (line.toLowerCase().includes('[警告]') || line.toLowerCase().includes('[warn')) return `<span class="seat-mod-error" style="background-color: #fff3cd; color: #856404;">${line}</span>`;
                            return `<span class="seat-mod-message">${line}</span>`; 
                        }).join('<br>');
                    }

                    if (changesSummary === accumulatedResponse && thinkingPart.trim() !== "") {
                        seatModificationOutput.innerHTML = `<p class="seat-mod-message">AI 回复 (未包含有效指令):</p><pre>${styledChangesSummary.replace(/<br>/g, '\n')}</pre>`;
                    } else if (accumulatedResponse.includes("<seat_changes>")) {
                        seatModificationOutput.innerHTML = `<strong>AI 指令处理结果:</strong><br>${styledChangesSummary}`;
                        if (!newSeatTableMarkdown && changesSummary !== "AI 表示没有修改。") { 
                             seatModificationOutput.innerHTML += `<br><br><strong>原始AI回复:</strong><pre>${accumulatedResponse.replace(/</g, "<").replace(/>/g, ">")}</pre>`;
                        }
                    } else { 
                         seatModificationOutput.innerHTML = `<strong>AI 回复:</strong><br>${styledChangesSummary}`;
                    }
                }
            } else { 
                if (seatModificationOutput) {
                    if (thinkingPart.trim() === '' || !accumulatedResponse.match(/<seat_changes>\s*<\/seat_changes>/i)) {
                         seatModificationOutput.innerHTML = `<pre>${accumulatedResponse.replace(/</g, "<").replace(/>/g, ">")}</pre>`;
                    } else {
                        seatModificationOutput.innerHTML = `<p class="seat-mod-message">AI 未返回可操作的修改指令。</p>`;
                    }
                }
            }
            if(seatModificationOutput) seatModificationOutput.style.display = 'block';
            if (seatModifyThinkingOutputDiv && seatModifyThinkingPre && seatModifyThinkingPre.textContent.trim() === '') {
                seatModifyThinkingOutputDiv.classList.remove('thinking-output-visible');
            }

        } catch (error) {
            console.error('修改座位时出错:', error);
            if (seatModificationOutput) {
                seatModificationOutput.innerHTML = `<p style="color: red;">修改座位失败: ${error.message}</p>`;
                seatModificationOutput.style.display = 'block';
            }
            if (seatModifyThinkingOutputDiv && seatModifyThinkingPre) { 
                seatModifyThinkingPre.textContent += `\n\n错误: ${error.message}`;
                if (seatModifyThinkingPre.textContent.trim() !== '') {
                    seatModifyThinkingOutputDiv.classList.add('thinking-output-visible');
                }
            }
        } finally {
            if (seatModificationLoading) seatModificationLoading.style.display = 'none';
            sendSeatModificationButton.disabled = false;
            if (seatModifyThinkingOutputDiv && seatModifyThinkingPre && seatModifyThinkingPre.textContent.trim() === '') {
                seatModifyThinkingOutputDiv.classList.remove('thinking-output-visible');
            }
        }
    });
}

// Helper function to parse Markdown table to 2D array
function markdownTableToArray(markdown) {
    if (!markdown || typeof markdown !== 'string') return [];
    const rows = markdown.trim().split('\n');
    return rows.map(row => {
        const cells = row.split('|').map(cell => cell.trim());
        if (cells.length > 0 && cells[0] === '') cells.shift();
        if (cells.length > 0 && cells[cells.length - 1] === '') cells.pop();
        return cells;
    });
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
    
    if (!changesMatch || !changesMatch[1] || changesMatch[1].trim() === "") {
        changesSummary = aiResponse.trim();
        return { newSeatTableMarkdown, changesSummary };
    }

    const changeInstructions = changesMatch[1].trim().split('\n').map(line => line.trim()).filter(line => line);
    
    if (changeInstructions.length === 0 || (changeInstructions.length === 1 && changeInstructions[0].toLowerCase() === "没有修改")) {
        changesSummary = "AI 表示没有修改。"; 
        return { newSeatTableMarkdown: currentSeatTableMarkdown, changesSummary }; 
    }

    let seatTableArray = markdownTableToArray(currentSeatTableMarkdown);
    const originalFormatArray = markdownTableToArray(originalSeatFormatMarkdown); 
    const appliedChanges = [];
    let tableWasModified = false;

    function mapPlaceholderToCoords(placeholderText, formatArray) {
        for (let r = 0; r < formatArray.length; r++) {
            if (r === 0 || formatArray[r].some(cell => cell.includes('---'))) continue;
            for (let c = 0; c < formatArray[r].length; c++) {
                if (formatArray[r][c] === placeholderText) return { r, c };
            }
        }
        return null;
    }

    function findPersonCoords(personName, currentTableArray) {
        for (let r = 0; r < currentTableArray.length; r++) {
            if (r === 0 || currentTableArray[r].some(cell => cell.includes('---'))) continue;
            for (let c = 0; c < currentTableArray[r].length; c++) {
                if (currentTableArray[r][c] === personName) return { r, c };
            }
        }
        return null;
    }

    for (const instruction of changeInstructions) {
        let match;
        if ((match = instruction.match(/^\[SWAP\]\s*(.+?)\s*<->\s*(.+)$/i))) {
            const item1Placeholder = match[1].trim(); 
            const item2Placeholder = match[2].trim(); 
            const coords1 = mapPlaceholderToCoords(item1Placeholder, originalFormatArray);
            const coords2 = mapPlaceholderToCoords(item2Placeholder, originalFormatArray);

            if (coords1 && coords2 && seatTableArray[coords1.r] && seatTableArray[coords1.c] !== undefined && seatTableArray[coords2.r] && seatTableArray[coords2.c] !== undefined) {
                const temp = seatTableArray[coords1.r][coords1.c];
                seatTableArray[coords1.r][coords1.c] = seatTableArray[coords2.r][coords2.c];
                seatTableArray[coords2.r][coords2.c] = temp;
                appliedChanges.push(`交换了 ${item1Placeholder} (新内容: ${seatTableArray[coords1.r][coords1.c]}) 和 ${item2Placeholder} (新内容: ${seatTableArray[coords2.r][coords2.c]}) 的位置。`);
                tableWasModified = true;
            } else {
                appliedChanges.push(`[错误] 交换失败: 原始座位 "${item1Placeholder}" 或 "${item2Placeholder}" 未在格式表中找到，或对应当前表格位置无效。`);
            }
        } else if ((match = instruction.match(/^\[MOVE\]\s*(.+?)\s*TO\s*(.+)$/i))) {
            const personName = match[1].trim();
            const targetSeatPlaceholder = match[2].trim(); 
            const personOldCoords = findPersonCoords(personName, seatTableArray);
            const targetCoords = mapPlaceholderToCoords(targetSeatPlaceholder, originalFormatArray);

            if (targetCoords) {
                const currentTargetContent = seatTableArray[targetCoords.r][targetCoords.c];
                if (currentTargetContent.toLowerCase() === '空座位' || currentTargetContent === targetSeatPlaceholder || currentTargetContent === personName) {
                    if (personOldCoords) seatTableArray[personOldCoords.r][personOldCoords.c] = '空座位'; 
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
            const seatToEmptyPlaceholder = match[1].trim(); 
            const coords = mapPlaceholderToCoords(seatToEmptyPlaceholder, originalFormatArray);
            if (coords) {
                appliedChanges.push(`清空了 "${seatToEmptyPlaceholder}" (原内容: ${seatTableArray[coords.r][coords.c]})。`);
                seatTableArray[coords.r][coords.c] = '空座位'; 
                tableWasModified = true;
            } else {
                appliedChanges.push(`[错误] 清空失败: 座位 "${seatToEmptyPlaceholder}" 未在格式表中找到。`);
            }
        } else if ((match = instruction.match(/^\[FILL\]\s*(.+?)\s*WITH\s*(.+)$/i))) {
            const seatToFillPlaceholder = match[1].trim(); 
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
            appliedChanges.push(instruction); 
        }
    }
    
    if (tableWasModified) newSeatTableMarkdown = arrayToMarkdownTable(seatTableArray);
    else newSeatTableMarkdown = null; 
    
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
        renderPersonnelTable(); 
        alert(`成功导入 ${importedData.length} 条人员信息。`);
        importPersonnelMarkdownTextarea.value = ''; 
    } else {
        alert('未能解析为有效的人员信息表格，请检查Markdown格式是否正确（需要表头、分隔线和数据行）。');
    }
});

// Event listener for copying the seat table format - 按钮已移除
// if (copyTableButton) { ... }

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

// Personnel List Toggle
if (togglePersonnelListButton && outputSection && contentWrapper) {
    togglePersonnelListButton.addEventListener('click', () => {
        const isNowCollapsed = outputSection.classList.toggle('personnel-collapsed');
        contentWrapper.classList.toggle('personnel-list-collapsed', isNowCollapsed);

        if (isNowCollapsed) {
            togglePersonnelListButton.innerHTML = '>'; 
            Array.from(togglePersonnelListButton.parentElement.children).forEach(button => {
                if (button.id !== 'toggle-personnel-list') { 
                    button.style.display = 'none';
                }
            });
        } else {
            togglePersonnelListButton.textContent = '折叠列表';
            Array.from(togglePersonnelListButton.parentElement.children).forEach(button => {
                 if (button.id !== 'toggle-personnel-list') {
                    button.style.display = ''; 
                 }
            });
        }
        renderPersonnelTable(); 
    });
}

// --- Custom Model Select Search Functionality ---
document.addEventListener('DOMContentLoaded', () => {
    const customSelectWrappers = document.querySelectorAll('.custom-select-wrapper');

    customSelectWrappers.forEach(wrapper => {
        const trigger = wrapper.querySelector('.custom-select-trigger');
        const dropdown = wrapper.querySelector('.custom-select-dropdown');
        const searchInput = dropdown.querySelector('.model-search-input');
        const optionsList = dropdown.querySelector('.custom-options-list');
        const hiddenValueInputId = trigger.id.replace('-trigger', '-select-value'); 
        const hiddenValueInput = document.getElementById(hiddenValueInputId);

        if (!trigger || !dropdown || !searchInput || !optionsList || !hiddenValueInput) return;

        trigger.addEventListener('click', (event) => {
            event.stopPropagation();
            customSelectWrappers.forEach(otherWrapper => {
                if (otherWrapper !== wrapper) {
                    otherWrapper.classList.remove('open');
                }
            });
            wrapper.classList.toggle('open');
            if (wrapper.classList.contains('open')) {
                searchInput.focus();
                searchInput.value = '';
                Array.from(optionsList.children).forEach(li => li.classList.remove('hidden-by-search'));
            }
        });

        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase();
            Array.from(optionsList.children).forEach(li => {
                const optionText = li.textContent.toLowerCase();
                if (li.dataset.value === "") { 
                    li.classList.remove('hidden-by-search');
                } else {
                    li.classList.toggle('hidden-by-search', !optionText.includes(searchTerm));
                }
            });
        });

        optionsList.addEventListener('click', (event) => {
            if (event.target.tagName === 'LI') {
                const selectedValue = event.target.dataset.value;
                const selectedText = event.target.textContent;
                
                trigger.textContent = selectedText;
                hiddenValueInput.value = selectedValue;
                wrapper.classList.remove('open');

                let taskType = '';
                if (trigger === infoModelTrigger) taskType = 'personnel';
                else if (trigger === seatingModelTrigger) taskType = 'seating';
                else if (trigger === seatModifyModelTrigger) taskType = 'seat_modification';
                
                if (taskType) {
                    currentDisplayedTaskType = taskType; 
                    modelUsageSettings[taskType] = selectedValue; 
                    updateActiveTaskModelDisplay(taskType);
                }
            }
        });
    });

    window.addEventListener('click', (event) => {
        customSelectWrappers.forEach(wrapper => {
            if (!wrapper.contains(event.target) && wrapper.classList.contains('open')) {
                wrapper.classList.remove('open');
            }
        });
        document.querySelectorAll('.provider-available-models-select.open').forEach(dropdown => {
            const itsTrigger = dropdown.querySelector('.provider-model-select-trigger');
            if (!dropdown.contains(event.target) && (!itsTrigger || !itsTrigger.contains(event.target))) {
                dropdown.classList.remove('open');
            }
        });
    });

    providerListDiv.addEventListener('input', (event) => {
        const target = event.target;
        if (target.classList.contains('provider-model-search-input')) {
            const searchTerm = target.value.toLowerCase();
            const dropdownWrapper = target.closest('.custom-select-dropdown'); 
            if (dropdownWrapper) {
                const list = dropdownWrapper.querySelector('.provider-model-options-list');
                if (list) {
                    Array.from(list.children).forEach(li => {
                        const modelLabel = li.querySelector('label');
                        if (modelLabel) {
                            const modelName = modelLabel.textContent.toLowerCase();
                            li.style.display = modelName.includes(searchTerm) ? '' : 'none';
                        } else if (li.textContent.toLowerCase().includes('没有可用')) { 
                            li.style.display = ''; 
                        }
                    });
                }
            }
        }
    });
});
