// --- Streaming GIF Management ---
let gifIntervals = {}; // Store intervals for each GIF element

function updateGifPosition(contentElement, gifElement) {
    if (!contentElement || !gifElement || gifElement.style.display === 'none') {
        return;
    }

    // Find the cursor span which is appended at the end of the stream
    const cursor = contentElement.querySelector('.streaming-cursor');
    if (cursor) {
        const containerRect = contentElement.getBoundingClientRect();
        const cursorRect = cursor.getBoundingClientRect();

        // Calculate position relative to the container, including scroll offsets
        let left = cursorRect.left - containerRect.left + contentElement.scrollLeft;
        let top = cursorRect.top - containerRect.top + contentElement.scrollTop;

        gifElement.style.left = `${left}px`;
        gifElement.style.top = `${top}px`;
    }
}


function manageStreamingGif(contentElement, gifElement, action) {
    if (!gifElement) return;

    const gifId = gifElement.id || gifElement.src; // Unique ID for the interval

    if (action === 'start') {
        gifElement.style.display = 'inline-block';
        setTimeout(() => gifElement.classList.add('visible'), 10); // Fade in

        // Clear any existing interval for this gif
        if (gifIntervals[gifId]) {
            clearInterval(gifIntervals[gifId]);
        }

        // Start a new interval to update position
        gifIntervals[gifId] = setInterval(() => {
            updateGifPosition(contentElement, gifElement);
        }, 50); // Update position every 50ms

    } else if (action === 'end') {
        gifElement.classList.remove('visible'); // Fade out
        
        // Clear the interval
        if (gifIntervals[gifId]) {
            clearInterval(gifIntervals[gifId]);
            delete gifIntervals[gifId];
        }

        // Hide the element after transition
        setTimeout(() => {
            gifElement.style.display = 'none';
        }, 300); // Match CSS transition duration
    }
}


// Function to show in-page notifications
function showInPageNotification(message, type = 'info') {
    const notificationArea = document.getElementById('in-page-notification-area');
    if (!notificationArea) {
        // If the area doesn't exist, create it dynamically.
        // This is a fallback, ideally it should be in the HTML.
        const newNotificationArea = document.createElement('div');
        newNotificationArea.id = 'in-page-notification-area';
        document.body.appendChild(newNotificationArea);
        // Call again, now that the area should exist.
        // Use a timeout to allow the DOM to update.
        setTimeout(() => showInPageNotification(message, type), 0);
        return;
    }

    const notificationId = `notification-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const notificationDiv = document.createElement('div');
    notificationDiv.id = notificationId;
    notificationDiv.className = `in-page-notification ${type}`;
    notificationDiv.textContent = message;

    notificationArea.appendChild(notificationDiv);

    // Animate in (requires CSS for .in-page-notification.show)
    setTimeout(() => {
        notificationDiv.classList.add('show');
    }, 50); 

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        notificationDiv.classList.remove('show');
        // Remove the element after the fade-out animation completes
        setTimeout(() => {
            const el = document.getElementById(notificationId);
            if (el) el.remove();
        }, 500); // Match this duration with CSS transition duration
    }, 5000);
}

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
const sidebarToggleButton = document.getElementById('sidebar-toggle-button'); // Settings button
const appWrapper = document.querySelector('.app-wrapper');
const mainContainer = document.querySelector('.container'); // Main content area that shifts
const containerWrapper = document.querySelector('.container-wrapper'); // Parent of .container and buttons

// Agent Sidebar elements
const agentSidebar = document.getElementById('agent-sidebar');
const agentToggleButton = document.getElementById('open-agent-button'); // Corrected ID based on HTML
const agentChatMessages = document.getElementById('agent-chat-messages');
const agentChatInput = document.getElementById('agent-chat-input');
const agentSendButton = document.getElementById('agent-send-button');
const agentClearButton = document.getElementById('agent-clear-button');
const agentSystemPromptTextarea = document.getElementById('agent-system-prompt');
const agentSaveConfigButton = document.getElementById('agent-save-config-button');

// Agent功能相关变量
let agentConversationHistory = []; // Agent对话历史
let agentSystemPrompt = ''; // Agent系统提示词

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

// Agent驱动模型选择元素 (确保这些ID与HTML中的新部分匹配)
const agentModelTrigger = document.getElementById('agent-model-trigger'); 
const agentModelDropdown = document.getElementById('agent-model-dropdown');
const agentModelSearchInput = agentModelDropdown ? agentModelDropdown.querySelector('.model-search-input') : null;
const agentModelOptionsList = agentModelDropdown ? agentModelDropdown.querySelector('.custom-options-list') : null;
const agentModelSelectValue = document.getElementById('agent-model-select-value');

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
    seat_modification: null,
    agent: null // 新增Agent驱动模型配置
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
        { list: seatModifyModelOptionsList, valueInput: seatModifyModelSelectValue, trigger: seatModifyModelTrigger, currentSavedValue: modelUsageSettings.seat_modification },
        { list: agentModelOptionsList, valueInput: agentModelSelectValue, trigger: agentModelTrigger, currentSavedValue: modelUsageSettings.agent } // 新增Agent模型选择
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
    if (agentModelSelectValue) agentModelSelectValue.value = modelUsageSettings.agent || ''; // 新增Agent模型加载
    
    populateModelSelects(); // This will now also update trigger texts
    updateActiveTaskModelDisplay('personnel'); 
}

function saveModelUsage() {
    modelUsageSettings.personnel = infoModelSelectValue.value;
    modelUsageSettings.seating = seatingModelSelectValue.value;
    modelUsageSettings.seat_modification = seatModifyModelSelectValue.value;
    modelUsageSettings.agent = agentModelSelectValue.value; // 新增Agent模型保存
    saveModelUsageSettings();
    showInPageNotification('模型使用选择已保存！', 'success');
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
            else if (taskType === 'agent') taskName = 'Agent驱动'; // 新增Agent任务类型
            
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
function getModelConfig(taskType) { // taskType: 'personnel', 'seating', 'seat_modification', 'agent'
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

// --- Sidebar Toggle Logic ---

function manageSidebarState() {
    const isSettingsOpen = settingsSidebar.classList.contains('open');
    const isAgentOpen = agentSidebar.classList.contains('open');
    const anySidebarOpen = isSettingsOpen || isAgentOpen;
    const sidebarWidth = 350; // px, should match CSS
    const buttonOffset = 20; // px

    console.log(`manageSidebarState: SettingsOpen=${isSettingsOpen}, AgentOpen=${isAgentOpen}, AnyOpen=${anySidebarOpen}`);

    if (anySidebarOpen) {
        // mainContainer.classList.add('sidebar-open-content-shift'); // No longer using class for margin
        mainContainer.style.width = `calc(100% - ${sidebarWidth}px)`;
        mainContainer.style.marginRight = `${sidebarWidth}px`; // Keep margin for spacing if needed, or remove if width alone is enough
        
        if (sidebarToggleButton) sidebarToggleButton.style.right = `${buttonOffset + sidebarWidth}px`;
        if (agentToggleButton) agentToggleButton.style.right = `${buttonOffset + sidebarWidth}px`;
        console.log(`   mainContainer width set to: calc(100% - ${sidebarWidth}px), marginRight to ${sidebarWidth}px`);
    } else {
        // mainContainer.classList.remove('sidebar-open-content-shift');
        mainContainer.style.width = '100%';
        mainContainer.style.marginRight = '0px';
        
        if (sidebarToggleButton) sidebarToggleButton.style.right = `${buttonOffset}px`;
        if (agentToggleButton) agentToggleButton.style.right = `${buttonOffset}px`;
        console.log('   mainContainer width set to: 100%, marginRight to 0px');
    }
    console.log('   sidebarToggleButton right:', sidebarToggleButton ? sidebarToggleButton.style.right : 'N/A');
    console.log('   agentToggleButton right:', agentToggleButton ? agentToggleButton.style.right : 'N/A');
}

if (sidebarToggleButton && settingsSidebar && mainContainer && agentSidebar) {
    sidebarToggleButton.addEventListener('click', (event) => {
        event.stopPropagation();
        if (settingsSidebar.classList.contains('open')) {
            settingsSidebar.classList.remove('open');
        } else {
            if (agentSidebar.classList.contains('open')) {
                agentSidebar.classList.remove('open');
            }
            settingsSidebar.classList.add('open');
        }
        manageSidebarState();
    });
}

if (agentToggleButton && agentSidebar && mainContainer && settingsSidebar) {
    agentToggleButton.addEventListener('click', (event) => {
        event.stopPropagation();
        if (agentSidebar.classList.contains('open')) {
            agentSidebar.classList.remove('open');
        } else {
            if (settingsSidebar.classList.contains('open')) {
                settingsSidebar.classList.remove('open');
            }
            agentSidebar.classList.add('open');
        }
        manageSidebarState();
    });
}

// Add event listeners for new close buttons in sidebars
const closeSidebarButtons = document.querySelectorAll('.close-sidebar-button');
closeSidebarButtons.forEach(button => {
    button.addEventListener('click', (event) => {
        event.stopPropagation();
        const sidebarToClose = button.closest('.sidebar');
        if (sidebarToClose && sidebarToClose.classList.contains('open')) {
            sidebarToClose.classList.remove('open');
            manageSidebarState();
        }
    });
});

// Removed: Click outside to close logic
// document.addEventListener('click', (event) => { ... });


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
                showInPageNotification('请先为此提供商填写 Base URL 和 API Key。', 'warning');
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
                showInPageNotification(`为 "${currentProvider.name || `提供商 #${fetchProviderIndex + 1}`}" 成功获取 ${currentProvider.availableModels.length} 个模型。请在列表中手动勾选需要启用的模型。`, 'success');
            } catch (error) {
                console.error('获取模型列表时出错:', error);
                showInPageNotification(`获取模型列表失败: ${error.message}`, 'error');
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
                showInPageNotification('手动模型ID已更新。', 'success');
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
            showInPageNotification('请输入 DeepSeek API Key。', 'warning');
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
        modelUsageSettings.agent = `${deepSeekProviderId}/deepseek-reasoner`; // Agent驱动模型默认使用deepseek-reasoner 
        saveModelUsageSettings();
        loadModelUsage(); 

        showInPageNotification('DeepSeek 模型已快速配置并选定用于相关任务！', 'success');
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
        showInPageNotification('请在侧边栏"使用模型选择"中为"信息整理"任务选择一个模型。', 'warning');
        return;
    }
    if (!personnelTaskConfig.baseURL || !personnelTaskConfig.modelId || !personnelTaskConfig.apiKey) {
        showInPageNotification('选择的"信息整理"模型配置不完整 (缺少Base URL, Model ID, 或 API Key)。请检查提供商配置。', 'warning');
        return;
    }

    if (!description) {
        showInPageNotification('请输入人物描述。', 'warning');
        return;
    }

    if (loadingIndicator && typeof loadingIndicator.style === 'object' && loadingIndicator.style !== null) {
        loadingIndicator.style.display = 'block';
    }
    markdownOutputDiv.innerHTML = ''; 
    sendDescriptionButton.disabled = true;

    if (personnelThinkingOutputDiv && personnelThinkingPre) {
        personnelThinkingPre.textContent = '';
        personnelThinkingOutputDiv.classList.remove('thinking-output-visible');
        const thinkingGif = personnelThinkingOutputDiv.querySelector('.streaming-gif');
        manageStreamingGif(personnelThinkingPre, thinkingGif, 'start');
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
        let textBeforeChanges = ""; 
        let changesBlockStreamContent = ""; 
        let inChangesBlock = false;
        let fullResponseForHistory = ""; 
        let unprocessedLinePart = ""; // Stores incomplete line from previous chunk

        markdownOutputDiv.textContent = ''; 

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            let jsonDataForLoopDoneCheck;

            for (const line of chunk.split('\n')) { // Process each line from the raw chunk
                if (line.startsWith('data: ')) {
                    const jsonData = line.substring(6).trim();
                    jsonDataForLoopDoneCheck = jsonData;
                    if (jsonData === '[DONE]') break;

                    try {
                        const parsedData = JSON.parse(jsonData);
                        const delta = parsedData.choices[0]?.delta;
                        const reasoningContent = delta?.reasoning_content || delta?.reasoning;
                        const outputContent = delta?.content;

                            if (outputContent) {
                                if (personnelThinkingOutputDiv && personnelThinkingOutputDiv.classList.contains('thinking-output-visible')) {
                                    const thinkingGif = personnelThinkingOutputDiv.querySelector('.streaming-gif');
                                    manageStreamingGif(null, thinkingGif, 'end');
                                    personnelThinkingOutputDiv.classList.remove('thinking-output-visible');
                                }
                                const generatingGif = markdownOutputWrapper.querySelector('.streaming-gif');
                                if (generatingGif.style.display === 'none') {
                                    manageStreamingGif(markdownOutputDiv, generatingGif, 'start');
                                }

                                fullResponseForHistory += outputContent;

                                if (!inChangesBlock) {
                                if (outputContent.includes('<changes>')) {
                                    const parts = outputContent.split('<changes>');
                                    textBeforeChanges += parts[0];
                                    changesBlockStreamContent = parts[1] || '';
                                    inChangesBlock = true;
                                    markdownOutputDiv.textContent = textBeforeChanges + "<changes>" + changesBlockStreamContent.split('</changes>')[0];
                                } else {
                                    textBeforeChanges += outputContent;
                                    markdownOutputDiv.textContent = textBeforeChanges;
                                }
                            } else {
                                changesBlockStreamContent += outputContent;
                                // Display raw stream within <changes>
                                markdownOutputDiv.innerHTML = textBeforeChanges + "<changes>" + changesBlockStreamContent.split('</changes>')[0] + '<span class="streaming-cursor"></span>';
                                
                                // Process complete lines for real-time table update
                                let currentProcessingContent = unprocessedLinePart + changesBlockStreamContent;
                                if (fullResponseForHistory.includes('</changes>')) { // If end tag seen anywhere in full history
                                    currentProcessingContent = currentProcessingContent.split('</changes>')[0];
                                }

                                const instructionLines = currentProcessingContent.split('\n');
                                unprocessedLinePart = instructionLines.pop() || ""; // Last part might be incomplete

                                for (const instructionLine of instructionLines) {
                                    if (instructionLine.trim()) {
                                        if (applySinglePersonnelChange(instructionLine.trim())) {
                                            renderPersonnelTable();
                                        }
                                    }
                                }
                                // If the stream has ended (or </changes> was in this chunk), process any remaining part
                                if (jsonData === '[DONE]' || (outputContent && outputContent.includes('</changes>'))) {
                                    if (unprocessedLinePart.trim()) {
                                        if (applySinglePersonnelChange(unprocessedLinePart.trim())) {
                                            renderPersonnelTable();
                                        }
                                        unprocessedLinePart = ""; 
                                    }
                                }
                            }
                        }

                        if (reasoningContent && personnelThinkingOutputDiv && personnelThinkingPre) {
                            personnelThinkingPre.textContent += reasoningContent;
                            if (personnelThinkingPre.textContent.trim() !== '') {
                                personnelThinkingOutputDiv.classList.add('thinking-output-visible');
                            } else {
                                personnelThinkingOutputDiv.classList.remove('thinking-output-visible');
                            }
                            personnelThinkingAutoScroll();
                        }

                    } catch (e) {
                        console.error('解析人员信息 SSE 数据块时出错:', e, '数据块:', jsonData);
                    }
                }
            }
            if (typeof jsonDataForLoopDoneCheck !== 'undefined' && jsonDataForLoopDoneCheck === '[DONE]') break;
        }
        // Final processing uses fullResponseForHistory
        const changesMatch = fullResponseForHistory.match(/<changes>([\s\S]*?)<\/changes>/i);
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
        if (loadingIndicator && typeof loadingIndicator.style === 'object' && loadingIndicator.style !== null) {
            loadingIndicator.style.display = 'none';
        }
        sendDescriptionButton.disabled = false;
        renderPersonnelTable();
        if (personnelThinkingOutputDiv) {
            const thinkingGif = personnelThinkingOutputDiv.querySelector('.streaming-gif');
            manageStreamingGif(null, thinkingGif, 'end');
            if (personnelThinkingPre && personnelThinkingPre.textContent.trim() === '') {
                 personnelThinkingOutputDiv.classList.remove('thinking-output-visible');
            }
        }
        const generatingGif = markdownOutputWrapper.querySelector('.streaming-gif');
        manageStreamingGif(null, generatingGif, 'end');
    }
});

// Event listener for clearing the personnel table
clearPersonnelTableButton.addEventListener('click', () => {
    personnelData = [];
    localStorage.removeItem('personnel_data');
    localStorage.removeItem('user_descriptions'); 
    conversationHistory = []; 
    renderPersonnelTable();
    showInPageNotification('人员信息表已清除。', 'info');
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

// 函数：实时应用单条人员信息变更指令
function applySinglePersonnelChange(lineInstruction) {
    let changeApplied = false;
    if (lineInstruction.startsWith('[新增]')) {
        const markdownLine = lineInstruction.substring('[新增]'.length).trim();
        const person = parseMarkdownTableRow(markdownLine);
        if (person && person['人物']) {
            // 避免重复添加（尽管在流式处理中，如果AI不重复发送指令，这可能不是必需的）
            if (!personnelData.find(p => p['人物'] === person['人物'])) {
                 personnelData.push(person);
                 changeApplied = true;
            }
        }
    } else if (lineInstruction.startsWith('[修改]')) {
        const markdownLine = lineInstruction.substring('[修改]'.length).trim();
        const updatedPerson = parseMarkdownTableRow(markdownLine);
        if (updatedPerson && updatedPerson['人物']) {
            const existingPersonIndex = personnelData.findIndex(p => p['人物'] === updatedPerson['人物']);
            if (existingPersonIndex !== -1) {
                personnelData[existingPersonIndex] = updatedPerson;
                changeApplied = true;
            } else {
                 // 如果AI指示修改但人员不存在，则视为新增
                 personnelData.push(updatedPerson);
                 changeApplied = true;
            }
        }
    } else if (lineInstruction.startsWith('[删除]')) {
        const personName = lineInstruction.substring('[删除]'.length).trim();
        if (personName) {
            const initialLength = personnelData.length;
            personnelData = personnelData.filter(p => p['人物'] !== personName);
            if (personnelData.length < initialLength) {
                changeApplied = true;
            }
        }
    }
    return changeApplied;
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

// Agent Thinking Output Elements - No longer a separate div, thinking will be part of the message
// const agentThinkingOutputDiv = document.getElementById('agent-thinking-output'); // Removed
// const agentThinkingPre = agentThinkingOutputDiv ? agentThinkingOutputDiv.querySelector('pre') : null; // Removed


// AI 智能编排座位
aiArrangeButton.addEventListener('click', async () => {
    const remarks = arrangementRemarksInput.value.trim();
    const personnelTable = personnelDataToMarkdown(personnelData); 
    
    const currentRows = parseInt(rowsInput.value);
    const currentCol = parseInt(colsInput.value);
    const currentDeskMates = parseInt(deskMatesInput.value);

    if (currentRows < 1 || currentCol < 1 || currentDeskMates < 1) {
        showInPageNotification('AI编排前，请确保行数、列数和同桌数均大于0。', 'warning');
        return;
    }
    if (currentDeskMates > currentCol) {
        showInPageNotification('AI编排前，请确保同桌数不大于列数。', 'warning');
        return;
    }

    const currentEmptyTableMarkdown = generateEmptySeatTableMarkdown(currentRows, currentCol, currentDeskMates);
    if (!currentEmptyTableMarkdown) {
        showInPageNotification('无法生成座位表结构，请检查行列及同桌数设置。', 'error');
        return;
    }
    localStorage.setItem('original_seat_format_markdown', currentEmptyTableMarkdown);
    const seatTableFormat = currentEmptyTableMarkdown; 

    const seatingTaskConfig = getModelConfig('seating');

    if (!seatingTaskConfig) {
        showInPageNotification('请在侧边栏"使用模型选择"中为"座位表生成"任务选择一个模型。', 'warning');
        return;
    }
    if (!seatingTaskConfig.baseURL || !seatingTaskConfig.modelId || !seatingTaskConfig.apiKey) {
        showInPageNotification('选择的"座位表生成"模型配置不完整。请检查提供商配置。', 'warning');
        return;
    }

    if (!personnelTable || personnelTable.trim() === '') {
        showInPageNotification('请先生成人员信息表。', 'warning');
        return;
    }

    if (!seatTableFormat || seatTableFormat.trim() === '') { 
        showInPageNotification('座位表格式为空，请先生成或检查设置。', 'warning');
        return;
    }

    if (aiThinkingOutputDiv && aiThinkingPre) {
        aiThinkingPre.textContent = '';
        aiThinkingOutputDiv.classList.remove('thinking-output-visible');
        const thinkingGif = aiThinkingOutputDiv.querySelector('.streaming-gif');
        manageStreamingGif(aiThinkingPre, thinkingGif, 'start');
    }
    
    if (tablePreviewDiv.innerHTML.trim() === '' || tablePreviewDiv.textContent.includes("请输入有效") || tablePreviewDiv.textContent.includes("无法生成")) {
        dynamicGenerateAndPreviewTable(); 
        if (tablePreviewDiv.innerHTML.trim() === '' || tablePreviewDiv.textContent.includes("请输入有效") || tablePreviewDiv.textContent.includes("无法生成")) {
             showInPageNotification('AI编排前，请确保行数、列数和同桌数设置有效。', 'warning');
             return;
        }
    }
    let seatTableFormatToUse = localStorage.getItem('original_seat_format_markdown');
    if (!seatTableFormatToUse) {
        dynamicGenerateAndPreviewTable();
        seatTableFormatToUse = localStorage.getItem('original_seat_format_markdown');
        if (!seatTableFormatToUse) {
            showInPageNotification('无法获取座位表格式，请检查行列及同桌数设置。', 'error');
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
- 务必确保人员信息表中的所有人物都被编排到座位上，并且不存在重复和遗漏。每个人只能被安排一次。
- 如果备注中有特定的座位要求，请优先满足这些要求。
以下是座位表格式，你需要将表格中 "座位一", "座位二" 等占位符替换为人物表中的人物名称，或者如果该座位无人则替换为 "空座位"。
<座位表格式>
${seatTableFormatToUse}
</座位表格式>
输出要求：
1.  请在 <编排好的座位表> 标签内输出修改后的完整 Markdown 表格（包括表头和分隔行），你严格按照上述的座位表格式输出。
2.  表格单元格内只允许填写人物的姓名或者 "空座位" 这两个词。绝对不能包含任何其他文字、解释、括号、标注（例如 "(未被编排)"）或任何非人名/非"空座位"的内容。
3.  确保每个人只被安排到一个座位，不出现重复安排。
4.  如果有人物因座位不足而未能安排，请不要在表格内标注。而是在 <编排好的座位表> 标签结束后，另起新的一行，使用以下确切格式列出所有未安排的人员："未安排人员：[姓名1], [姓名2], ..."。如果所有人都已安排，则不要输出此行。
5.  除了 Markdown 表格和可选的未安排人员列表外，不要输出任何其他解释性文字或标签。
请严格按照上述要求输出。
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
                            if (aiThinkingOutputDiv && aiThinkingOutputDiv.classList.contains('thinking-output-visible')) {
                                const thinkingGif = aiThinkingOutputDiv.querySelector('.streaming-gif');
                                manageStreamingGif(null, thinkingGif, 'end');
                                aiThinkingOutputDiv.classList.remove('thinking-output-visible');
                            }
                            const generatingGif = tablePreviewDiv.querySelector('.streaming-gif');
                             if (generatingGif.style.display === 'none') {
                                manageStreamingGif(tablePreviewDiv, generatingGif, 'start');
                            }

                            accumulatedContent += outputContent; 
                            const tableStartTag = "<编排好的座位表>";
                            const tableEndTag = "</编排好的座位表>";
                            let currentTableSegment = "";
                            if (accumulatedContent.includes(tableStartTag)) {
                                let startIndex = accumulatedContent.indexOf(tableStartTag) + tableStartTag.length;
                                let endIndex = accumulatedContent.indexOf(tableEndTag);
                                currentTableSegment = endIndex === -1 ? accumulatedContent.substring(startIndex) : accumulatedContent.substring(startIndex, endIndex);
                                
                                if (currentTableSegment.trim() && currentTableSegment.includes("|")) {
                                    tablePreviewDiv.innerHTML = marked.parse(currentTableSegment) + '<span class="streaming-cursor"></span>';
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
        if (aiThinkingOutputDiv) {
            const thinkingGif = aiThinkingOutputDiv.querySelector('.streaming-gif');
            manageStreamingGif(null, thinkingGif, 'end');
            if (aiThinkingPre && aiThinkingPre.textContent.trim() === '') {
                aiThinkingOutputDiv.classList.remove('thinking-output-visible');
            }
        }
        const generatingGif = tablePreviewDiv.querySelector('.streaming-gif');
        manageStreamingGif(null, generatingGif, 'end');
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
            showInPageNotification('请粘贴要导入的座位表Markdown。', 'info');
            return;
        }

        const lines = markdown.split('\n');
        if (lines.length < 2 || !lines[0].includes('|') || !lines[1].includes('---')) {
            showInPageNotification('Markdown格式似乎不正确，至少需要包含表头和分隔行。', 'warning');
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
            showInPageNotification(`座位表已成功导入并显示。检测到 ${rows} 行, ${cols} 列, ${deskMates} 同桌。`, 'success');
        } else {
            showInPageNotification('座位表已成功导入并显示。未能自动识别行列同桌数，请手动检查。', 'info');
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
            showInPageNotification('请输入修改指令。', 'warning');
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
            showInPageNotification('请在侧边栏"使用模型选择"中为"座位微调"任务选择一个模型。', 'warning');
            return;
        }
        if (!seatModificationTaskConfig.baseURL || !seatModificationTaskConfig.modelId || !seatModificationTaskConfig.apiKey) {
            showInPageNotification('选择的"座位微调"模型配置不完整。请检查提供商配置。', 'warning');
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
            const thinkingGif = seatModifyThinkingOutputDiv.querySelector('.streaming-gif');
            manageStreamingGif(seatModifyThinkingPre, thinkingGif, 'start');
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
                            if (outputContent) {
                                if (seatModifyThinkingOutputDiv && seatModifyThinkingOutputDiv.classList.contains('thinking-output-visible')) {
                                    const thinkingGif = seatModifyThinkingOutputDiv.querySelector('.streaming-gif');
                                    manageStreamingGif(null, thinkingGif, 'end');
                                    seatModifyThinkingOutputDiv.classList.remove('thinking-output-visible');
                                }
                                const generatingGif = seatModificationOutput.querySelector('.streaming-gif');
                                if (generatingGif.style.display === 'none') {
                                    manageStreamingGif(seatModificationOutput, generatingGif, 'start');
                                }
                                accumulatedResponse += outputContent;
                                seatModificationOutput.innerHTML = accumulatedResponse + '<span class="streaming-cursor"></span>';
                            }
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
            if (seatModifyThinkingOutputDiv) {
                const thinkingGif = seatModifyThinkingOutputDiv.querySelector('.streaming-gif');
                manageStreamingGif(null, thinkingGif, 'end');
                if (seatModifyThinkingPre && seatModifyThinkingPre.textContent.trim() === '') {
                    seatModifyThinkingOutputDiv.classList.remove('thinking-output-visible');
                }
            }
            const generatingGif = seatModificationOutput.querySelector('.streaming-gif');
            manageStreamingGif(null, generatingGif, 'end');
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
        showInPageNotification('请粘贴要导入的Markdown表格。', 'info');
        return;
    }

    const importedData = markdownToPersonnelData(markdown);
    if (importedData.length > 0) {
        personnelData = importedData;
        renderPersonnelTable(); 
        showInPageNotification(`成功导入 ${importedData.length} 条人员信息。`, 'success');
        importPersonnelMarkdownTextarea.value = ''; 
    } else {
        showInPageNotification('未能解析为有效的人员信息表格，请检查Markdown格式是否正确（需要表头、分隔线和数据行）。', 'warning');
    }
});

// Event listener for copying the seat table format - 按钮已移除
// if (copyTableButton) { ... }

// Event listener for copying the arranged seat table
copyArrangedTableButton.addEventListener('click', () => {
    const arrangedMarkdownTable = localStorage.getItem('arranged_seat_table_markdown') || '';
    if (arrangedMarkdownTable) {
        navigator.clipboard.writeText(arrangedMarkdownTable).then(() => {
            showInPageNotification('编排好的座位表已复制到剪贴板！', 'success');
        }, () => {
            showInPageNotification('复制失败，请手动复制表格内容。', 'error');
        });
    } else {
        showInPageNotification('请先进行AI智能编排。', 'warning');
    }
});

// Event listener for copying the personnel info
if (copyPersonnelInfoButton) {
    copyPersonnelInfoButton.addEventListener('click', () => {
        const markdownToCopy = personnelDataToMarkdown(personnelData);
        if (markdownToCopy) {
            navigator.clipboard.writeText(markdownToCopy).then(() => {
                showInPageNotification('人员信息已复制到剪贴板！', 'success');
            }, () => {
                showInPageNotification('复制失败，请手动复制。', 'error');
            });
        } else {
            showInPageNotification('当前没有人员信息可复制。', 'info');
        }
    });
}

// Personnel List Toggle
if (togglePersonnelListButton && outputSection && contentWrapper) {
    togglePersonnelListButton.addEventListener('click', () => {
        const isNowCollapsed = outputSection.classList.toggle('personnel-collapsed');
        // contentWrapper.classList.toggle('personnel-list-collapsed', isNowCollapsed); // This class might not be needed anymore if direct width styling is used

        if (isNowCollapsed) {
            togglePersonnelListButton.innerHTML = '▶'; // Indicate it can be expanded
        } else {
            togglePersonnelListButton.innerHTML = '<'; // Indicate it can be collapsed
        }
        renderPersonnelTable(); // Re-render table for collapsed/expanded view
        // Hide/show description input based on collapsed state
        const descriptionGroup = outputSection.querySelector('.description-input-group');
        if (descriptionGroup) {
            descriptionGroup.style.display = isNowCollapsed ? 'none' : 'flex';
        }
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
                else if (trigger === agentModelTrigger) taskType = 'agent'; // 新增Agent模型选择支持
                
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

// === Agent功能相关代码 - 新增的AI Agent统筹功能 ===

// Agent对话功能 - 发送消息到AI API
if (agentSendButton && agentChatInput && agentChatMessages) {
    agentSendButton.addEventListener('click', sendAgentMessage);
    agentChatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendAgentMessage();
        }
    });
}

// Agent清空对话历史功能
if (agentClearButton && agentChatMessages) {
    agentClearButton.addEventListener('click', () => {
        if (confirm('确定要清空所有对话记录吗？')) {
            agentConversationHistory = [];
            agentChatMessages.innerHTML = '';
            showInPageNotification('Agent对话记录已清空。', 'info');
        }
    });
}

// Agent配置保存功能
if (agentSaveConfigButton && agentSystemPromptTextarea) {
    agentSaveConfigButton.addEventListener('click', () => {
        agentSystemPrompt = agentSystemPromptTextarea.value.trim();
        localStorage.setItem('agent_system_prompt', agentSystemPrompt);
        showInPageNotification('Agent配置已保存！', 'success');
    });
}

// 页面加载时恢复Agent配置
document.addEventListener('DOMContentLoaded', () => {
    const savedSystemPrompt = localStorage.getItem('agent_system_prompt') || '';
    agentSystemPrompt = savedSystemPrompt;
    if (agentSystemPromptTextarea) {
        agentSystemPromptTextarea.value = savedSystemPrompt;
    }
});

// Agent发送消息核心函数
async function sendAgentMessage() {
    const userMessage = agentChatInput.value.trim();
    if (!userMessage) return;

    // 获取Agent模型配置
    const agentConfig = getModelConfig('agent');
    if (!agentConfig) {
        showInPageNotification('请在侧边栏"使用模型选择"中为"Agent驱动模型"选择一个模型。', 'warning');
        return;
    }

    // 添加用户消息到界面
    addAgentMessage('user', userMessage);
    agentChatInput.value = '';
    agentSendButton.disabled = true;

    // 添加用户消息到对话历史
    agentConversationHistory.push({ role: 'user', content: userMessage });

    const aiMessageId = `agent-msg-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;
    let aiMessageDiv = createAgentMessageElement('assistant', 'AI 正在思考中...', aiMessageId);
    agentChatMessages.appendChild(aiMessageDiv);
    let aiMessageContentDiv = aiMessageDiv.querySelector('.agent-message-content');
    // Ensure the thinking message is visible and scroll to it
    agentChatMessages.scrollTop = agentChatMessages.scrollHeight;

    const agentGif = document.getElementById('agent-streaming-gif');
    manageStreamingGif(aiMessageContentDiv, agentGif, 'start');

    try {
        // 构建请求消息
        const messagesForAPI = [];
        // 系统提示词 (如果已配置)
        // if (agentSystemPrompt) { messagesForAPI.push({ role: 'system', content: agentSystemPrompt }); }
        
        const recentHistory = agentConversationHistory.slice(-20); // 保留最近20条
        messagesForAPI.push(...recentHistory);

        let accumulatedAiResponse = ""; // 用于存储完整的AI回复以加入历史记录

        try {
            const response = await fetch(`${agentConfig.baseURL}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${agentConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: agentConfig.modelId,
                    messages: messagesForAPI,
                    temperature: 0.7,
                    max_tokens: 2000,
                    stream: true // 启用流式传输
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API请求失败: ${response.status} ${response.statusText} - ${errorData.error?.message || '未知错误'}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let thinkingContent = "";

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
                            const reasoningChunk = delta?.reasoning_content || delta?.reasoning;
                            const contentChunk = delta?.content;

                            if (reasoningChunk) {
                                thinkingContent += reasoningChunk;
                                // Update the "Thinking..." message bubble with reasoning content
                                // For simplicity, we'll show reasoning in a pre tag within the message
                                if (aiMessageContentDiv.innerHTML.startsWith('AI 正在思考中...')) {
                                    aiMessageContentDiv.innerHTML = '<strong>AI 思考过程:</strong><pre style="margin-top: 5px; white-space: pre-wrap; word-wrap: break-word; max-height: 150px; overflow-y: auto; background-color: #f0f0f0; border: 1px dashed #ccc; padding: 5px; border-radius: 4px;"></pre>';
                                }
                                const preElement = aiMessageContentDiv.querySelector('pre');
                                if (preElement) {
                                    preElement.textContent = thinkingContent;
                                    preElement.scrollTop = preElement.scrollHeight; // Scroll pre if it overflows
                                }
                                agentChatMessages.scrollTop = agentChatMessages.scrollHeight;
                            }
                            if (contentChunk) {
                                // If we were showing reasoning, clear it or replace it when actual content arrives
                                if (aiMessageContentDiv.querySelector('pre')) {
                                    aiMessageContentDiv.innerHTML = ''; // Clear reasoning once content starts
                                    accumulatedAiResponse = ''; // Reset accumulated response
                                }
                                accumulatedAiResponse += contentChunk;
                                aiMessageContentDiv.innerHTML = marked.parse(accumulatedAiResponse) + '<span class="streaming-cursor"></span>'; // Render Markdown
                                agentChatMessages.scrollTop = agentChatMessages.scrollHeight;
                            }
                        } catch (e) {
                            console.error('解析Agent SSE数据块时出错:', e, '数据块:', jsonData);
                        }
                    }
                }
                if (typeof jsonData !== 'undefined' && jsonData === '[DONE]') break;
            }
            
            // 流结束后，将完整的AI回复添加到历史记录
            if (accumulatedAiResponse) {
                 agentConversationHistory.push({ role: 'assistant', content: accumulatedAiResponse });
            } else { // 如果没有内容块，但可能有错误或空回复
                if (!aiMessageContentDiv.textContent) {
                     aiMessageContentDiv.textContent = 'AI未返回有效内容。';
                }
            }

        } catch (error) {
            console.error('Agent API调用错误:', error);
            if (aiMessageContentDiv) {
                aiMessageContentDiv.innerHTML = marked.parse(`错误: ${error.message}`);
            } else {
                addAgentMessage('assistant', `处理回复时出错: ${error.message}`);
            }
            showInPageNotification(`Agent调用失败: ${error.message}`, 'error');
        } 
        // No separate outer catch needed if all primary operations are within the inner try-catch
        // The outer try was primarily for the initial message creation which is now less prone to fail before fetch.
    } finally { 
        agentSendButton.disabled = false;
        const agentGif = document.getElementById('agent-streaming-gif');
        manageStreamingGif(null, agentGif, 'end');
        // If thinking was shown and not replaced by content, ensure it's cleared or finalized.
        // This logic is now handled by replacing thinking content with actual content.
        if(agentChatMessages) agentChatMessages.scrollTop = agentChatMessages.scrollHeight;
    }
}


// 创建Agent消息元素的辅助函数
function createAgentMessageElement(role, content, id) {
    const messageDiv = document.createElement('div');
    if (id) messageDiv.id = id;
    messageDiv.className = `agent-message ${role === 'user' ? 'user-message' : 'agent-message-assistant'}`;
    
    const roleLabel = role === 'user' ? '用户' : 'Agent';
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'agent-message-header';
    headerDiv.innerHTML = `<strong>${roleLabel}</strong> <span class="agent-message-time">${timestamp}</span>`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'agent-message-content';
    // If content is "AI 正在思考中..." or similar, don't parse as markdown yet.
    // Markdown parsing will happen when actual AI response content is streamed.
    if (content.includes('AI 正在思考中...') || (content.startsWith('<strong>AI 思考过程:</strong>'))) {
        contentDiv.innerHTML = content; // Allow initial HTML for thinking message
    } else {
        contentDiv.innerHTML = marked.parse(content); // Parse other content as Markdown
    }

    messageDiv.appendChild(headerDiv);
    messageDiv.appendChild(contentDiv);
    return messageDiv;
}

// 添加消息到Agent对话界面 (现在使用辅助函数)
function addAgentMessage(role, content) {
    if (!agentChatMessages) return null;
    const messageElement = createAgentMessageElement(role, content);
    agentChatMessages.appendChild(messageElement);
    agentChatMessages.scrollTop = agentChatMessages.scrollHeight;
    return messageElement.id; // 返回创建的元素的ID，如果需要引用
}

// 移除指定的Agent消息 (这个函数可能不再需要，因为我们是更新现有消息或直接添加最终消息)
// function removeAgentMessage(messageId) {
//     if (messageId) {
//         const messageElement = document.getElementById(messageId);
//         if (messageElement) {
//             messageElement.remove();
//         }
//     }
// }

// === Agent功能代码结束 ===

// --- 自动滚动功能 ---
function setupAutoScrollForPreElement(preElement) {
    if (!preElement) return () => {}; 
    let userHasScrolledUp = false;

    preElement.addEventListener('scroll', () => {
        if (preElement.scrollTop + preElement.clientHeight < preElement.scrollHeight - 20) {
            userHasScrolledUp = true;
        } else {
            userHasScrolledUp = false;
        }
    });

    return function autoScrollIfEnabled() {
        if (!userHasScrolledUp) {
            preElement.scrollTop = preElement.scrollHeight;
        }
    };
}

// 为每个思考过程的 pre 元素设置自动滚动
const personnelThinkingAutoScroll = personnelThinkingPre ? setupAutoScrollForPreElement(personnelThinkingPre) : () => {};
const aiThinkingAutoScroll = aiThinkingPre ? setupAutoScrollForPreElement(aiThinkingPre) : () => {};
const seatModifyThinkingAutoScroll = seatModifyThinkingPre ? setupAutoScrollForPreElement(seatModifyThinkingPre) : () => {};
const agentThinkingAutoScroll = () => { // Modified to scroll the main chat messages if needed
    if (agentChatMessages) {
        // Check if the last message contains a pre tag (our thinking process)
        const lastMessage = agentChatMessages.lastElementChild;
        if (lastMessage) {
            const preInLastMessage = lastMessage.querySelector('pre');
            if (preInLastMessage) {
                // Scroll the pre element itself if it's scrollable
                if (preInLastMessage.scrollHeight > preInLastMessage.clientHeight) {
                     preInLastMessage.scrollTop = preInLastMessage.scrollHeight;
                }
            }
            // Always scroll the main chat container to the bottom to see the latest message/thinking
            agentChatMessages.scrollTop = agentChatMessages.scrollHeight;
        }
    }
};
