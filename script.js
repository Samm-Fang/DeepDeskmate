// --- Streaming GIF Management ---
let gifIntervals = {}; // Store intervals for each GIF element

function updateGifPosition(contentElement, gifElement, mode = 'full-follow') {
    if (!contentElement || !gifElement || gifElement.style.display === 'none') {
        return;
    }

    const cursor = contentElement.querySelector('.streaming-cursor');
    if (cursor) {
        if (mode === 'bottom-follow') {
            // Y-axis is fixed to the bottom by CSS, only update X-axis
            gifElement.style.left = `${cursor.offsetLeft}px`;
            gifElement.style.top = ''; // Let CSS handle the 'bottom' property
        } else { // 'full-follow'
            gifElement.style.bottom = ''; // Remove bottom positioning
            gifElement.style.left = `${cursor.offsetLeft}px`;
            gifElement.style.top = `${cursor.offsetTop}px`;
        }
    }
}


function manageStreamingGif(contentElement, gifElement, action, mode = 'full-follow') {
    if (!gifElement) return;

    const gifId = gifElement.id || gifElement.src; // Unique ID for the interval

    if (action === 'start') {
        gifElement.style.display = 'inline-block';
        setTimeout(() => gifElement.classList.add('visible'), 10); // Fade in

        // Clear any existing interval for this gif
        if (gifIntervals[gifId]) {
            clearInterval(gifIntervals[gifId]);
        }

        // Add the correct class for the mode
        if (mode === 'bottom-follow') {
            gifElement.classList.add('thinking-mode');
        } else {
            gifElement.classList.remove('thinking-mode');
        }

        // Start a new interval to update position
        gifIntervals[gifId] = setInterval(() => {
            updateGifPosition(contentElement, gifElement, mode);
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
const tableOutputDiv = document.getElementById('table-output');

// --- 新增：座位表模式切换 ---
const modeClassroomButton = document.getElementById('mode-classroom');
const modeCustomButton = document.getElementById('mode-custom');
const classroomControls = document.getElementById('classroom-controls');
const customControls = document.getElementById('custom-controls');
const customRowsInput = document.getElementById('custom-rows');
const customColsInput = document.getElementById('custom-cols');

let currentSeatMode = 'classroom'; // 'classroom' or 'custom'
let customLayoutData = []; // 二维数组，用于存储自定义布局
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
const clearSeatTableButton = document.getElementById('clear-seat-table');

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
        manageStreamingGif(personnelThinkingPre, thinkingGif, 'start', 'bottom-follow');
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
                                let currentHtml = textBeforeChanges + "<changes>" + changesBlockStreamContent.split('</changes>')[0];
                                markdownOutputDiv.innerHTML = currentHtml + '<span class="streaming-cursor"></span>';
                                
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
                            // DOM manipulation for PRE tags
                            const cursor = personnelThinkingPre.querySelector('.streaming-cursor');
                            if(cursor) cursor.remove();
                            personnelThinkingPre.appendChild(document.createTextNode(reasoningContent));
                            const newCursor = document.createElement('span');
                            newCursor.className = 'streaming-cursor';
                            personnelThinkingPre.appendChild(newCursor);

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

    if (!tableOutputDiv) return; // 安全检查

    if (rows < 1 || cols < 1 || deskMates < 1) {
        tableOutputDiv.innerHTML = '<p style="color: #aaa;">请输入有效的行数、列数和同桌数。</p>';
        closeSeatModificationDialog(); // 确保在无效输入时也隐藏
        return;
    }
    if (deskMates > cols) {
        tableOutputDiv.innerHTML = '<p style="color: red;">同桌数不能大于列数。</p>';
        closeSeatModificationDialog(); // 确保在无效输入时也隐藏
        return;
    }

    const markdownTable = generateEmptySeatTableMarkdown(rows, cols, deskMates);
    if (!markdownTable) {
        tableOutputDiv.innerHTML = '<p style="color: red;">无法生成座位表预览。</p>';
        closeSeatModificationDialog();
        return;
    }

    tableOutputDiv.innerHTML = marked.parse(markdownTable);
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
// --- 新增：自定义座位模式相关函数 ---

/**
 * 根据自定义的行数和列数，渲染一个可交互的表格编辑器
 */
function renderCustomTableEditor() {
    const rows = parseInt(customRowsInput.value);
    const cols = parseInt(customColsInput.value);

    if (isNaN(rows) || isNaN(cols) || rows < 1 || cols < 1) {
        tableOutputDiv.innerHTML = '<p style="color: #aaa;">请输入有效的表格行数和列数。</p>';
        return;
    }

    // 初始化或调整自定义布局数据
    // 如果行数或列数变化，需要重新生成 customLayoutData
    if (customLayoutData.length !== rows || (customLayoutData[0] && customLayoutData[0].length !== cols)) {
        customLayoutData = Array.from({ length: rows }, () =>
            Array.from({ length: cols }, () => ({ type: 'empty', content: null, seat_id: null }))
        );
    }
    
    // 修复BUG 4a: 先更新数据模型中的ID，再根据模型生成HTML
    updateSeatIdsInData();

    let tableHtml = '<table id="custom-seat-table" class="custom-seat-table">';
    for (let i = 0; i < rows; i++) {
        tableHtml += '<tr>';
        for (let j = 0; j < cols; j++) {
            const cellData = customLayoutData[i][j];
            let cellContent = '';
            let cellClass = 'empty-cell';
            if (cellData.type === 'seat') {
                cellClass = 'seat-cell';
                if (cellData.content) { // 如果有编排内容（人名）
                    cellContent = `<span class="seat-id">${cellData.seat_id}</span><span class="seat-name">${cellData.content}</span>`;
                } else { // 如果只是空座位
                    // 现在 seat_id 已经提前更新，所以这里总能获取到
                    cellContent = `座位${cellData.seat_id}`;
                }
            } else if (cellData.type === 'remark') {
                cellClass = 'remark-cell';
                cellContent = cellData.content;
            }
            tableHtml += `<td class="custom-cell ${cellClass}" data-row="${i}" data-col="${j}">${cellContent}</td>`;
        }
        tableHtml += '</tr>';
    }
    tableHtml += '</table>';

    tableOutputDiv.innerHTML = tableHtml;
    // localStorage.setItem('arranged_seat_table_markdown', ''); // 不在此处清空，仅在清空按钮处清空
    closeSeatModificationDialog();
}

/**
 /**
  * 仅更新数据模型 customLayoutData 中的 seat_id
  */
 function updateSeatIdsInData() {
     let seatCounter = 1;
     for (let i = 0; i < customLayoutData.length; i++) {
         for (let j = 0; j < customLayoutData[i].length; j++) {
             const cellData = customLayoutData[i][j];
             if (cellData.type === 'seat') {
                 cellData.seat_id = seatCounter++;
             } else {
                 cellData.seat_id = null;
             }
         }
     }
 }
/**
 * 将Markdown表格解析为 customLayoutData 格式
 * @param {string} markdown - Markdown表格字符串
 * @returns {Array} - customLayoutData 格式的二维数组
 */
function markdownToCustomLayoutData(markdown) {
    const lines = markdown.trim().split('\n').slice(2); // 跳过表头和分隔线
    return lines.map(line => {
        const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
        return cells.map(cellContent => {
            if (cellContent.startsWith('座位')) {
                const seatIdMatch = cellContent.match(/座位(\d+)/);
                return { type: 'seat', content: null, seat_id: seatIdMatch ? parseInt(seatIdMatch[1]) : null };
            } else if (cellContent.trim() === '') {
                return { type: 'empty', content: null, seat_id: null };
            } else {
                return { type: 'remark', content: cellContent, seat_id: null };
            }
        });
    });
}

/**
 * 将AI编排好的结果渲染到自定义表格上
 * @param {string} arrangedMarkdown - AI返回的编排好的Markdown表格
 */
function renderArrangedCustomTable(arrangedMarkdown) {
    const arrangedArray = markdownTableToArray(arrangedMarkdown).slice(2); // 跳过表头和分隔线

    if (arrangedArray.length !== customLayoutData.length || (arrangedArray[0] && arrangedArray[0].length !== customLayoutData[0].length)) {
        console.error("AI返回的表格维度与自定义布局不匹配。");
        tablePreviewDiv.innerHTML = `<p style="color: red;">AI返回的表格维度与当前布局不匹配，无法渲染。</p>`;
        return;
    }

    // 创建一个从 seat_id 到人名的映射
    const seatIdToNameMap = new Map();
    arrangedArray.forEach((row, r) => {
        row.forEach((cellContent, c) => {
            const originalCellData = customLayoutData[r][c];
            if (originalCellData && originalCellData.type === 'seat') {
                // AI返回的表格里，座位会被人名或“空座位”替代
                if (cellContent.trim() !== '空座位' && cellContent.trim() !== '') {
                    seatIdToNameMap.set(originalCellData.seat_id, cellContent.trim());
                }
            }
        });
    });

    // 更新 customLayoutData 中的 content
    for (let i = 0; i < customLayoutData.length; i++) {
        for (let j = 0; j < customLayoutData[i].length; j++) {
            const cellData = customLayoutData[i][j];
            if (cellData.type === 'seat') {
                cellData.content = seatIdToNameMap.get(cellData.seat_id) || null;
            }
        }
    }
    
    // 重新渲染整个编辑器以显示姓名
    renderCustomTableEditor();
    // 渲染后，找到对应的座位单元格并填入名字
    for (let i = 0; i < customLayoutData.length; i++) {
        for (let j = 0; j < customLayoutData[i].length; j++) {
            const cellData = customLayoutData[i][j];
            if (cellData.type === 'seat' && cellData.content) {
                const cellElement = document.querySelector(`.custom-cell[data-row="${i}"][data-col="${j}"]`);
                if (cellElement) {
                    cellElement.innerHTML = `<span class="seat-id">${cellData.seat_id}</span><span class="seat-name">${cellData.content}</span>`;
                }
            }
        }
    }
    applyGenderColoring(); // 应用性别着色
}

/**
 * 将Markdown表格解析为 customLayoutData 格式
 * @param {string} markdown - Markdown表格字符串
 * @returns {Array} - customLayoutData 格式的二维数组
 */
function markdownToCustomLayoutData(markdown) {
    const lines = markdown.trim().split('\n').slice(2); // 跳过表头和分隔线
    return lines.map(line => {
        const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
        return cells.map(cellContent => {
            if (cellContent.startsWith('座位')) {
                const seatIdMatch = cellContent.match(/座位(\d+)/);
                return { type: 'seat', content: null, seat_id: seatIdMatch ? parseInt(seatIdMatch[1]) : null };
            } else if (cellContent.trim() === '') {
                return { type: 'empty', content: null, seat_id: null };
            } else {
                return { type: 'remark', content: cellContent, seat_id: null };
            }
        });
    });
}

/**
 * 将AI编排好的结果渲染到自定义表格上
 * @param {string} arrangedMarkdown - AI返回的编排好的Markdown表格
 */
function renderArrangedCustomTable(arrangedMarkdown) {
    const arrangedArray = markdownTableToArray(arrangedMarkdown).slice(2); // 跳过表头和分隔线

    if (arrangedArray.length !== customLayoutData.length || (arrangedArray[0] && arrangedArray[0].length !== customLayoutData[0].length)) {
        console.error("AI返回的表格维度与自定义布局不匹配。");
        tablePreviewDiv.innerHTML = `<p style="color: red;">AI返回的表格维度与当前布局不匹配，无法渲染。</p>`;
        return;
    }

    // 创建一个从 seat_id 到人名的映射
    const seatIdToNameMap = new Map();
    arrangedArray.forEach((row, r) => {
        row.forEach((cellContent, c) => {
            const originalCellData = customLayoutData[r][c];
            if (originalCellData && originalCellData.type === 'seat') {
                // AI返回的表格里，座位会被人名或“空座位”替代
                if (cellContent.trim() !== '空座位' && cellContent.trim() !== '') {
                    seatIdToNameMap.set(originalCellData.seat_id, cellContent.trim());
                }
            }
        });
    });

    // 更新 customLayoutData 中的 content
    for (let i = 0; i < customLayoutData.length; i++) {
        for (let j = 0; j < customLayoutData[i].length; j++) {
            const cellData = customLayoutData[i][j];
            if (cellData.type === 'seat') {
                cellData.content = seatIdToNameMap.get(cellData.seat_id) || null;
            }
        }
    }
    
    // 重新渲染整个编辑器以显示姓名
    renderCustomTableEditor();
    // 渲染后，找到对应的座位单元格并填入名字
    for (let i = 0; i < customLayoutData.length; i++) {
        for (let j = 0; j < customLayoutData[i].length; j++) {
            const cellData = customLayoutData[i][j];
            if (cellData.type === 'seat' && cellData.content) {
                const cellElement = document.querySelector(`.custom-cell[data-row="${i}"][data-col="${j}"]`);
                if (cellElement) {
                    cellElement.innerHTML = `<span class="seat-id">${cellData.seat_id}</span><span class="seat-name">${cellData.content}</span>`;
                }
            }
        }
    }
    applyGenderColoring(); // 应用性别着色
}

// --- 模式切换逻辑 ---
function switchSeatMode(mode) {
    // 修复BUG 1: 如果AI正在运行，则不允许切换
    if (aiArrangeButton.disabled) {
        showInPageNotification('AI正在生成座位中，请稍后切换模式。', 'warning');
        return;
    }

    if (mode === 'classroom') {
        currentSeatMode = 'classroom';
        modeClassroomButton.classList.add('active');
        modeCustomButton.classList.remove('active');
        classroomControls.style.display = 'block';
        customControls.style.display = 'none';
        // 修复BUG 3: 清理自定义模式的数据
        customLayoutData = [];
        dynamicGenerateAndPreviewTable(); // 渲染教室模式的预览
    } else if (mode === 'custom') {
        currentSeatMode = 'custom';
        modeCustomButton.classList.add('active');
        modeClassroomButton.classList.remove('active');
        customControls.style.display = 'block';
        classroomControls.style.display = 'none';
        // 修复BUG 3: 清理教室模式的编排结果
        localStorage.removeItem('arranged_seat_table_markdown');
        renderCustomTableEditor(); // 渲染自定义模式的编辑器
    }
}

// 为行数、列数、同桌数输入框添加事件监听器
rowsInput.addEventListener('input', dynamicGenerateAndPreviewTable);
colsInput.addEventListener('input', dynamicGenerateAndPreviewTable);
deskMatesInput.addEventListener('input', dynamicGenerateAndPreviewTable);

// --- 新增：自定义座位输入和模式切换的事件监听 ---
if (modeClassroomButton) {
    modeClassroomButton.addEventListener('click', () => switchSeatMode('classroom'));
}
if (modeCustomButton) {
    modeCustomButton.addEventListener('click', () => switchSeatMode('custom'));
}
if (customRowsInput) {
    customRowsInput.addEventListener('input', renderCustomTableEditor);
}
if (customColsInput) {
    customColsInput.addEventListener('input', renderCustomTableEditor);
}

// --- 新增：自定义表格交互事件监听 ---
tablePreviewDiv.addEventListener('click', (event) => {
    if (currentSeatMode !== 'custom') return;
    const cell = event.target.closest('.custom-cell');
    if (!cell) return;

    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    const cellData = customLayoutData[row][col];
    if (cellData.type === 'empty') {
        cellData.type = 'seat';
    }
    // 如果已经是座位，再次点击不执行任何操作，以防误触
    
    // renderCustomTableEditor(); // 重新渲染以更新UI和座位号
    // 优化：不再全量渲染，而是只更新目标单元格
    updateSeatIdsInData(); // 确保ID是最新的
    const newCellData = customLayoutData[row][col]; // 获取更新后的数据
    cell.className = 'custom-cell seat-cell'; // 更新class
    cell.innerHTML = `座位${newCellData.seat_id}`; // 更新内容
});

tablePreviewDiv.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    if (currentSeatMode !== 'custom') return;
    const cell = event.target.closest('.custom-cell');
    if (!cell) return;

    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    showCustomContextMenu(event.clientX, event.clientY, row, col);
});

/**
 * 显示自定义的上下文菜单
 * @param {number} x - 鼠标X坐标
 * @param {number} y - 鼠标Y坐标
 * @param {number} row - 单元格行号
 * @param {number} col - 单元格列号
 */
function showCustomContextMenu(x, y, row, col) {
    // 移除已存在的菜单
    const existingMenu = document.getElementById('custom-seat-context-menu');
    if (existingMenu) existingMenu.remove();

    const cellData = customLayoutData[row][col];
    
    const menu = document.createElement('div');
    menu.id = 'custom-seat-context-menu';
    menu.style.top = `${y}px`;
    menu.style.left = `${x}px`;

    let menuItems = '';

    if (cellData.type === 'seat') {
        menuItems += `<div class="context-menu-item" data-action="delete-seat">删除座位</div>`;
    }
    
    menuItems += `<div class="context-menu-item" data-action="edit-remark">添加/编辑备注</div>`;
    
    if (cellData.type === 'remark') {
        menuItems += `<div class="context-menu-item" data-action="clear-cell">清空单元格</div>`;
    }


    menu.innerHTML = menuItems;
    document.body.appendChild(menu);

    menu.addEventListener('click', (event) => {
        const action = event.target.dataset.action;
        if (action === 'delete-seat') {
            customLayoutData[row][col] = { type: 'empty', content: null, seat_id: null };
            renderCustomTableEditor();
        } else if (action === 'edit-remark') {
            const cellElement = document.querySelector(`.custom-cell[data-row="${row}"][data-col="${col}"]`);
            if (cellElement) {
                cellElement.innerHTML = `<input type="text" class="remark-input" value="${cellData.content || ''}" />`;
                const input = cellElement.querySelector('input');
                input.focus();
                input.select();

                const saveRemark = () => {
                    const newRemark = input.value.trim();
                    if (newRemark) {
                        customLayoutData[row][col] = { type: 'remark', content: newRemark, seat_id: null };
                    } else {
                        customLayoutData[row][col] = { type: 'empty', content: null, seat_id: null };
                    }
                    renderCustomTableEditor();
                };

                input.addEventListener('blur', saveRemark);
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        input.blur(); // 触发 blur 事件来保存
                    } else if (e.key === 'Escape') {
                        renderCustomTableEditor(); // 取消编辑，恢复原状
                    }
                });
            }
        } else if (action === 'clear-cell') {
            customLayoutData[row][col] = { type: 'empty', content: null, seat_id: null };
            renderCustomTableEditor();
        }
        
        menu.remove();
    });

    // 点击菜单外部时关闭菜单
    setTimeout(() => {
        document.addEventListener('click', () => menu.remove(), { once: true });
    }, 0);
}

// 页面加载时也尝试生成一次，以防有默认值
document.addEventListener('DOMContentLoaded', () => {
    // 初始化时，根据默认模式 'classroom' 来生成预览
    switchSeatMode(currentSeatMode);
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
    
    let seatTableFormat = '';
    let systemPromptSupplement = ''; // 用于自定义模式的提示词补充

    if (currentSeatMode === 'classroom') {
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

        const classroomMarkdown = generateEmptySeatTableMarkdown(currentRows, currentCol, currentDeskMates);
        if (!classroomMarkdown) {
            showInPageNotification('无法生成座位表结构，请检查行列及同桌数设置。', 'error');
            return;
        }
        localStorage.setItem('original_seat_format_markdown', classroomMarkdown);
        seatTableFormat = classroomMarkdown;
    } else { // 'custom' mode
        let seatList = [];
        let seatCounter = 1;
        let header = '|';
        let separator = '|';
        const cols = customLayoutData.length > 0 ? customLayoutData[0].length : 0;
        for (let i = 0; i < cols; i++) {
            header += ` Col${i+1} |`;
            separator += ` --- |`;
        }
        
        let body = customLayoutData.map(row => {
            let rowStr = '|';
            row.forEach(cell => {
                if (cell.type === 'seat') {
                    rowStr += ` 座位${cell.seat_id} |`;
                    seatList.push({ seat_id: cell.seat_id });
                } else if (cell.type === 'remark') {
                    rowStr += ` ${cell.content} |`;
                } else {
                    rowStr += `  |`;
                }
            });
            return rowStr;
        }).join('\n');

        if (seatList.length === 0) {
            showInPageNotification('请在自定义座位表中至少创建一个座位。', 'warning');
            return;
        }
        
        seatTableFormat = `${header}\n${separator}\n${body}`;
        systemPromptSupplement = '请注意：你正在为一个用户自定义的、可能不规则的座位布局进行编排。座位并非标准矩阵排列。请根据提供的座位ID顺序和学生关系，在此特殊布局下做出最合理的安排。';
    }

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
        manageStreamingGif(aiThinkingPre, thinkingGif, 'start', 'bottom-follow');
    }
    
    if (tablePreviewDiv.innerHTML.trim() === '' || tablePreviewDiv.textContent.includes("请输入有效") || tablePreviewDiv.textContent.includes("无法生成")) {
        dynamicGenerateAndPreviewTable(); 
        if (tablePreviewDiv.innerHTML.trim() === '' || tablePreviewDiv.textContent.includes("请输入有效") || tablePreviewDiv.textContent.includes("无法生成")) {
             showInPageNotification('AI编排前，请确保行数、列数和同桌数设置有效。', 'warning');
             return;
        }
    }
    let seatTableFormatToUse = '';
    if (currentSeatMode === 'classroom') {
        seatTableFormatToUse = localStorage.getItem('original_seat_format_markdown');
        if (!seatTableFormatToUse) {
            dynamicGenerateAndPreviewTable();
            seatTableFormatToUse = localStorage.getItem('original_seat_format_markdown');
            if (!seatTableFormatToUse) {
                showInPageNotification('无法获取教室座位表格式，请检查行列及同桌数设置。', 'error');
                return;
            }
        }
    } else { // 'custom' mode
        // 修复BUG 2: 确保使用为自定义模式动态生成的seatTableFormat
        seatTableFormatToUse = seatTableFormat;
        if (!seatTableFormatToUse) {
             showInPageNotification('无法获取自定义座位表格式。', 'error');
             return;
        }
    }

    // 修复BUG 1: 禁用模式切换按钮
    aiArrangeButton.disabled = true;
    modeClassroomButton.disabled = true;
    modeCustomButton.disabled = true;

    const systemPrompt = `
你的任务是根据提供的人物表和备注内容，为人物编排教室的座位，并按照座位表格式输出编排好的座位信息。
${systemPromptSupplement}
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
                            thinkingContent += reasoningContent; // Keep accumulating for history
                            // DOM manipulation for PRE tags
                            const cursor = aiThinkingPre.querySelector('.streaming-cursor');
                            if(cursor) cursor.remove();
                            aiThinkingPre.appendChild(document.createTextNode(reasoningContent));
                            const newCursor = document.createElement('span');
                            newCursor.className = 'streaming-cursor';
                            aiThinkingPre.appendChild(newCursor);
                            
                            aiThinkingPre.scrollTop = aiThinkingPre.scrollHeight;
                            if (aiThinkingPre.textContent.trim() !== '') {
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
                                    let currentHtml = marked.parse(currentTableSegment);
                                    tableOutputDiv.innerHTML = currentHtml + '<span class="streaming-cursor"></span>';
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
            localStorage.setItem('arranged_seat_table_markdown', finalTableMarkdown);
            if (currentSeatMode === 'classroom') {
                tableOutputDiv.innerHTML = marked.parse(finalTableMarkdown);
                applyGenderColoring();
                displayOriginalSeatNumbers();
            } else {
                renderArrangedCustomTable(finalTableMarkdown);
            }
            
            if (aiThinkingOutputDiv && (!thinkingContent || thinkingContent.trim() === '')) {
                aiThinkingOutputDiv.classList.remove('thinking-output-visible');
            }
            openSeatModificationDialog();
        } else {
            tableOutputDiv.innerHTML = '<p>AI 未能按预期格式返回编排好的座位表。</p>';
            if (aiThinkingOutputDiv && thinkingContent && thinkingContent.trim() !== '') {
                aiThinkingOutputDiv.classList.add('thinking-output-visible');
            }
        }

    } catch (error) {
        console.error('调用 API 进行座位编排时出错:', error);
        tableOutputDiv.innerHTML = `<p style="color: red;">座位编排失败: ${error.message}</p>`;
        if (aiThinkingOutputDiv && aiThinkingPre) {
            aiThinkingPre.textContent += `\n\n错误: ${error.message}`;
            aiThinkingOutputDiv.classList.add('thinking-output-visible'); 
        }
    } finally {
        aiArrangeButton.disabled = false;
        // 修复BUG 1: 重新启用模式切换按钮
        modeClassroomButton.disabled = false;
        modeCustomButton.disabled = false;
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
        
        if (currentSeatMode === 'classroom') {
            tableOutputDiv.innerHTML = marked.parse(markdown);
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
            applyGenderColoring();
            displayOriginalSeatNumbers();
        } else { // Custom mode
            customLayoutData = markdownToCustomLayoutData(markdown);
            if (customLayoutData.length > 0) {
                customRowsInput.value = customLayoutData.length;
                customColsInput.value = customLayoutData[0].length;
                renderCustomTableEditor();
                showInPageNotification(`自定义座位表已成功导入。`, 'success');
            } else {
                showInPageNotification('未能从Markdown中解析出有效的自定义布局。', 'warning');
            }
        }
        
        importSeatTableMarkdownTextarea.value = '';
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
            if (tableOutputDiv.innerHTML.trim() === "" && originalSeatFormat) {
                 tableOutputDiv.innerHTML = marked.parse(originalSeatFormat);
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
            manageStreamingGif(seatModifyThinkingPre, thinkingGif, 'start', 'bottom-follow');
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
                                thinkingPart += reasoningContent; // Keep accumulating for history
                                // DOM manipulation for PRE tags
                                const cursor = seatModifyThinkingPre.querySelector('.streaming-cursor');
                                if(cursor) cursor.remove();
                                seatModifyThinkingPre.appendChild(document.createTextNode(reasoningContent));
                                const newCursor = document.createElement('span');
                                newCursor.className = 'streaming-cursor';
                                seatModifyThinkingPre.appendChild(newCursor);

                                if (seatModifyThinkingPre.textContent.trim() !== '') {
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
                                seatModificationOutput.innerHTML = accumulatedResponse.replace(/\n/g, '<br>') + '<span class="streaming-cursor"></span>';
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
                localStorage.setItem('arranged_seat_table_markdown', newSeatTableMarkdown);
                if (currentSeatMode === 'classroom') {
                    tableOutputDiv.innerHTML = marked.parse(newSeatTableMarkdown);
                    displayOriginalSeatNumbers();
                } else {
                    renderArrangedCustomTable(newSeatTableMarkdown);
                }
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
    let markdownToCopy = '';
    if (currentSeatMode === 'classroom') {
        markdownToCopy = localStorage.getItem('arranged_seat_table_markdown') || '';
    } else {
        // For custom mode, we might want to copy the AI's raw output, which is already stored
        markdownToCopy = localStorage.getItem('arranged_seat_table_markdown') || '';
        // If there's no arranged table, maybe copy the current layout definition? For now, let's stick to the arranged one.
    }

    if (markdownToCopy) {
        navigator.clipboard.writeText(markdownToCopy).then(() => {
            showInPageNotification('编排好的座位表已复制到剪贴板！', 'success');
        }, () => {
            showInPageNotification('复制失败，请手动复制表格内容。', 'error');
        });
    } else {
        showInPageNotification('没有可复制的编排结果。请先进行AI智能编排。', 'warning');
    }
});

// --- 新增：清空座位按钮事件监听 ---
if (clearSeatTableButton) {
    clearSeatTableButton.addEventListener('click', () => {
        if (confirm('确定要清空所有座位上的人员安排吗？此操作会保留座位布局。')) {
            localStorage.removeItem('arranged_seat_table_markdown');
            if (currentSeatMode === 'classroom') {
                dynamicGenerateAndPreviewTable(); // 重新生成空的教室表格
            } else {
                // 清空自定义布局中的人名
                for (let i = 0; i < customLayoutData.length; i++) {
                    for (let j = 0; j < customLayoutData[i].length; j++) {
                        if (customLayoutData[i][j].type === 'seat') {
                            customLayoutData[i][j].content = null;
                        }
                    }
                }
                renderCustomTableEditor();
            }
            closeSeatModificationDialog();
            showInPageNotification('座位已清空。', 'success');
        }
    });
}

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

// 新增：Agent AI 的统一系统提示词生成函数
function getUnifiedAgentSystemPrompt(userRemarks = "") {
    // --- 系统提示词 (System Prompt) ---
    // 这部分定义了AI的角色、能力和输出格式，相对固定。
    const systemPrompt = `
**您是一个高级座位编排和人员管理 AI 助手。**
您的目标是根据用户提供的上下文和请求，智能地选择并执行一项操作或者解答用户的问题（一般是关于人员信息整理和座位表编排）。

**您的能力和可用工具：**
您可以通过生成特定格式的输出来调用以下任一功能。请仔细分析用户意图，选择最合适的一个。

**输出格式 (严格遵循以下其中一种):**

**A. 调整座位布局:**
   如果您认为需要更改当前的座位布局（例如，座位不足），请使用此格式。
   <AdjustLayout rows="新行数" cols="新列数" desks_per_group="新同桌数" />
   - **何时使用:** 仅当布局更改对于完成用户请求是*必需的*或明显有利时。
   - **注意:** 系统将首先更新布局，然后您需要根据新布局继续处理原始请求。
   - 在调整布局后，你会收到一份由系统发送给你的新的座位表格式，然后您可以处理其他操作。

**B. 更新人员信息:**
   如果用户的请求是关于添加、删除或修改人员信息，请使用此格式。
   <SetPersonnelTable>
   [变更内容]
   </SetPersonnelTable>
   - **变更内容格式:**
     - 新增: \`[新增]| 姓名 | 性别 | 备注 |\`
     - 修改: \`[修改]| 姓名 | 性别 | 备注 |\`
     - 删除: \`[删除]姓名\`
     - 无变化: \`没有变化\`

**C. 生成新的座位安排:**
   当用户想要一个全新的座位表时（通常是在空表或重置的表上），请使用此格式。
   <SetSeatTable>
   [完整的Markdown表格]
   </SetSeatTable>
   - **内容:** 表格需包含所有应安排的人员，未使用的座位应标记为 "空座位"。
   - **未安排人员:** 如果有人因座位不足未被安排，请在 \`</SetSeatTable>\` 标签结束后，另起一行，用此确切格式列出: "未安排人员：[姓名1], [姓名2], ..."

**D. 微调现有的座位安排:**
   当用户想要对已有的座位表进行局部修改时，请使用此格式。
   <AdjustSeatTable>
   [调整指令，每条占一行]
   </AdjustSeatTable>
   - **调整指令格式:**
     - 交换: \`[SWAP] 座位X <-> 座位Y\` (座位占位符请参考上下文中的 \`originalSeatFormat\`)
     - 移动: \`[MOVE] 人员姓名 TO 座位X\`
     - 清空: \`[EMPTY] 座位X\`
     - 填充: \`[FILL] 座位X WITH 人员姓名\`
   - **无法执行:** 如果指令无法完成，请在标签内用纯文本解释原因。

**E. 纯文本回复:**
   如果用户的请求不适用于上述任何工具（例如，打招呼、提问、常规对话），或者您需要向用户澄清问题，请直接回复纯文本。
   此时你的回复无需任何特殊标签，但是你需要避免使用任何上文工具中提到的标签，避免系统误判。
   - **提示:** 您可以在回复中使用 Markdown 来格式化文本（如列表、粗体）以提高可读性。
    * 你需要确保回复内容清晰、简洁且友好。你需要尽量避免过于冗长的回答或者长篇大论。

**重要规则:**
-   您可以在一次回复中组合使用B、C、D功能，系统会按顺序执行。
-   功能A (\`AdjustLayout\`) 是特殊的。如果您决定使用它，请不要在同一次回复中包含任何其他功能。系统会先调整布局，然后提示您继续。
-   请精确使用上下文中提供的人员姓名和座位占位符。
-   除非格式本身允许，否则不要在标签内外添加任何额外的解释性文字。
`;

    // --- 上下文提示词 (Context Prompt) ---
    // 这部分包含所有动态变化的信息，每次调用时都会重新生成。
    const currentPersonnelTable = personnelDataToMarkdown(personnelData);
    const currentRows = rowsInput ? parseInt(rowsInput.value) || 0 : 0;
    const currentCols = colsInput ? parseInt(colsInput.value) || 0 : 0;
    const currentDesksPerGroup = deskMatesInput ? parseInt(deskMatesInput.value) || 0 : 0;

    let originalSeatFormat = localStorage.getItem('original_seat_format_markdown') || "";
    if (!originalSeatFormat && currentRows > 0 && currentCols > 0 && currentDesksPerGroup > 0) {
        originalSeatFormat = generateEmptySeatTableMarkdown(currentRows, currentCols, currentDesksPerGroup);
    }

    const currentSeatTable = localStorage.getItem('arranged_seat_table_markdown') || originalSeatFormat;

    let seatMappingInfo = "当前没有已编排的座位表，或无法生成映射信息。\n";
    if (localStorage.getItem('arranged_seat_table_markdown')) {
        const originalFormatArrayForMapping = markdownTableToArray(originalSeatFormat);
        const currentSeatTableArrayForMapping = markdownTableToArray(currentSeatTable);
        if (originalFormatArrayForMapping.length > 0 && currentSeatTableArrayForMapping.length > 0 && originalFormatArrayForMapping.length === currentSeatTableArrayForMapping.length) {
            seatMappingInfo = "原始座位占位符与当前内容的对应关系 (用于帮助您理解当前占用情况):\n";
            for (let r = 0; r < originalFormatArrayForMapping.length; r++) {
                if (r === 0 || originalFormatArrayForMapping[r].some(cell => cell.includes('---'))) continue;
                for (let c = 0; c < originalFormatArrayForMapping[r].length; c++) {
                    const originalSeatPlaceholder = (originalFormatArrayForMapping[r][c] || "").trim();
                    const currentSeatContent = (currentSeatTableArrayForMapping[r] ? (currentSeatTableArrayForMapping[r][c] || '未知') : '未知').trim();
                    if (originalSeatPlaceholder && !originalSeatPlaceholder.toLowerCase().includes('走廊') && originalSeatPlaceholder !== '') {
                        seatMappingInfo += `- "${originalSeatPlaceholder}": 当前是 "${currentSeatContent}"\n`;
                    }
                }
            }
        }
    }
    
    const userDefinedSystemPromptSupplement = agentSystemPromptTextarea ? agentSystemPromptTextarea.value.trim() : "";

    const contextPrompt = `
**当前的背景信息:**
-   **当前人员信息表 (\`currentPersonnelTable\`):**
${currentPersonnelTable || "无人员信息"}
-   **当前座位布局:**
    - 行数: ${currentRows}
    - 列数: ${currentCols}
    - 每组同桌数: ${currentDesksPerGroup}
-   **原始座位表格式/结构 (\`originalSeatFormat\`):**
${originalSeatFormat || "未定义座位格式"}
-   **当前已安排的座位表 (\`currentSeatTable\`):**
${currentSeatTable || "无已安排的座位表"}
-   **座位映射信息 (\`seatMappingInfo\`):**
${seatMappingInfo}
-   **用户的备注/指令 (\`remarks\`):**
${userRemarks}
${userDefinedSystemPromptSupplement ? `\n- **用户额外系统提示补充:**\n${userDefinedSystemPromptSupplement}` : ""}

请根据以上背景信息和您的能力，处理用户的请求。
`;

    // 返回一个对象，包含拆分后的两部分
    return { systemPrompt, contextPrompt };
}

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
async function sendAgentMessage(isContinuation = false, continuationParams = {}) {
    console.log("[Agent] sendAgentMessage called. isContinuation:", isContinuation, "agentChatInput:", agentChatInput); // 新增日志
    let userMessageContent; 
    if (isContinuation) {
        userMessageContent = continuationParams.prompt || "布局已更新，你可以检查新的布局，然后根据新的布局继续处理之前用户的需求，或者处理下一步操作。";
        if (continuationParams.displayMessage) { 
            addAgentMessage('system-notification', continuationParams.displayMessage);
        }
    } else {
        try {
            if (!agentChatInput) {
                console.error("[Agent] agentChatInput element is null before accessing .value. Cannot send message.");
                showInPageNotification("错误：Agent聊天输入框未找到 (检查点1)。", "error");
                if (typeof agentSendButton !== 'undefined' && agentSendButton) {
                    agentSendButton.disabled = false;
                }
                return;
            }
            userMessageContent = agentChatInput.value.trim(); // 尝试访问 .value
            if (!userMessageContent) {
                // 如果内容为空，也需要确保按钮状态正确
                if (typeof agentSendButton !== 'undefined' && agentSendButton) {
                     agentSendButton.disabled = false; // 如果之前被禁用了
                }
                return;
            }
            addAgentMessage('user', userMessageContent); 
            agentChatInput.value = ''; // 清空输入框
        } catch (e) {
            console.error("[Agent] Error accessing agentChatInput.value:", e);
            showInPageNotification(`错误处理用户输入: ${e.message}`, "error");
            if (typeof agentSendButton !== 'undefined' && agentSendButton) {
                agentSendButton.disabled = false;
            }
            // 将错误信息也显示在聊天界面，以便调试
            if (typeof addAgentMessage === 'function' && typeof marked === 'function' && agentChatMessages) {
                 const errorMsgId = `agent-err-${Date.now()}`;
                 let errorMsgDiv = createAgentMessageElement('assistant', `错误 (输入处理): ${e.message}`, errorMsgId);
                 errorMsgDiv.classList.add('agent-message-error'); // 添加错误样式类
                 agentChatMessages.appendChild(errorMsgDiv);
                 agentChatMessages.scrollTop = agentChatMessages.scrollHeight;
            }
            return; // 阻止后续执行
        }
    }

    // 获取Agent模型配置
    const agentConfig = getModelConfig('agent');
    console.log("[Agent] Config:", agentConfig); // 日志1
    if (!agentConfig) {
        showInPageNotification('请在侧边栏"使用模型选择"中为"Agent驱动模型"选择一个模型。', 'warning');
        agentSendButton.disabled = false; // 确保按钮在出错时恢复可用
        return;
    }

    agentSendButton.disabled = true;

    // 添加用户消息到对话历史
    if (!isContinuation) {
        agentConversationHistory.push({ role: 'user', content: userMessageContent });
    }
    // 对于延续性的调用，其提示语是系统生成的，不应作为用户消息添加到历史记录中。
    // 因此，移除了原有的 else if 分支。


    const aiMessageId = `agent-msg-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;
    let aiMessageDiv = createAgentMessageElement('assistant', 'AI 正在思考中...', aiMessageId);
    agentChatMessages.appendChild(aiMessageDiv);
    let aiMessageContentDiv = aiMessageDiv.querySelector('.agent-message-content');
    // Ensure the thinking message is visible and scroll to it
    agentChatMessages.scrollTop = agentChatMessages.scrollHeight;

    const agentGif = document.getElementById('agent-streaming-gif');
    // For agent, thinking and generating are handled differently.
    // Start with fixed position, then switch to full-follow.
    agentGif.classList.add('thinking-mode'); // Start fixed at bottom-left
    manageStreamingGif(aiMessageContentDiv, agentGif, 'start', 'bottom-follow');


    try {
        // 获取拆分后的提示词
        const { systemPrompt, contextPrompt } = getUnifiedAgentSystemPrompt(userMessageContent);
        console.log("[Agent] System Prompt for API:", systemPrompt);
        console.log("[Agent] Context Prompt for API:", contextPrompt);

        // 构建发送给API的消息体
        const messagesForAPI = [
            { role: 'system', content: systemPrompt },
            // 将上下文作为第一条用户消息发送，用户的实际请求作为第二条
            { role: 'user', content: contextPrompt },
            { role: 'user', content: userMessageContent }
        ];
        console.log("[Agent] Messages for API:", JSON.stringify(messagesForAPI, null, 2)); // 日志3
        
        let accumulatedAiResponse = ""; 

        try {
            console.log(`[Agent] Fetching from: ${agentConfig.baseURL}/v1/chat/completions with model ${agentConfig.modelId}`); // 日志4
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
                                if (aiMessageContentDiv.querySelector('pre') || aiMessageContentDiv.textContent.includes('AI 正在思考中...')) {
                                    aiMessageContentDiv.innerHTML = ''; // Clear reasoning/thinking message
                                    accumulatedAiResponse = ''; // Reset
                                    // Switch GIF to full-follow mode
                                    manageStreamingGif(aiMessageContentDiv, agentGif, 'start', 'full-follow');
                                }
                                accumulatedAiResponse += contentChunk;
                                let currentHtml = marked.parse(accumulatedAiResponse);
                                aiMessageContentDiv.innerHTML = currentHtml + '<span class="streaming-cursor"></span>'; // Render Markdown
                                agentChatMessages.scrollTop = agentChatMessages.scrollHeight;
                            }
                        } catch (e) {
                            console.error('解析Agent SSE数据块时出错:', e, '数据块:', jsonData);
                        }
                    }
                }
                if (typeof jsonData !== 'undefined' && jsonData === '[DONE]') break;
            }
            
            // --- 开始 Agent 响应解析逻辑 ---
            const responseForHistory = accumulatedAiResponse; 

            // 1. 检查 <AdjustLayout> - 这是排他性的，并会触发重新提示
            const adjustLayoutMatch = accumulatedAiResponse.match(/<AdjustLayout\s+rows="(\d+)"\s+cols="(\d+)"\s+desks_per_group="(\d+)"\s*\/>/i);
            if (adjustLayoutMatch) {
                const newRows = parseInt(adjustLayoutMatch[1]);
                const newCols = parseInt(adjustLayoutMatch[2]);
                const newDesksPerGroup = parseInt(adjustLayoutMatch[3]);

                if (rowsInput && colsInput && deskMatesInput) {
                    rowsInput.value = newRows;
                    colsInput.value = newCols;
                    deskMatesInput.value = newDesksPerGroup;
                    
                    dynamicGenerateAndPreviewTable();
                    
                    const layoutUpdateMessage = `Agent 建议将布局调整为：${newRows}行，${newCols}列，每组${newDesksPerGroup}人。布局已更新。`;
                    showInPageNotification(layoutUpdateMessage, 'info');
                    addAgentMessage('system-notification', layoutUpdateMessage);

                    if (aiMessageContentDiv) {
                        aiMessageContentDiv.innerHTML = marked.parse(`*Agent请求调整布局: ${newRows}行, ${newCols}列, ${newDesksPerGroup}同桌。正在基于新布局继续...*`);
                    }
                    
                    const lastUserMessageForContinuation = agentConversationHistory.filter(m => m.role === 'user').pop()?.content || userMessageContent;
                    
                    // **核心修复**：确保只有在布局调整后才发起延续性调用
                    // 并且在 finally 块中不再处理此响应，因为我们将发起新调用
                    agentSendButton.disabled = false; // Re-enable button before recursive call
                    manageStreamingGif(null, agentGif, 'end'); // End current gif before new call
                    sendAgentMessage(true, { 
                        prompt: `布局已更新为 ${newRows}行, ${newCols}列, ${newDesksPerGroup}同桌。请根据此新布局处理我之前的请求："${lastUserMessageForContinuation}"`,
                        displayMessage: "Agent 已调整布局，正在基于新布局继续处理您的原始请求..." 
                    });
                    return; // **核心修复**：立即退出，防止后续代码执行
                } else {
                    showInPageNotification("错误：无法找到行列同桌数输入框以更新布局。", "error");
                    if (aiMessageContentDiv) aiMessageContentDiv.innerHTML = marked.parse(accumulatedAiResponse);
                    agentConversationHistory.push({ role: 'assistant', content: responseForHistory });
                }
            } else {
                // 没有布局调整，因此我们可以处理其他工具
                let anyToolProcessed = false;
                let displayHtmlParts = [];

                // 2. 检查 <SetPersonnelTable>
                const setPersonnelMatch = accumulatedAiResponse.match(/<SetPersonnelTable>([\s\S]*?)<\/SetPersonnelTable>/i);
                if (setPersonnelMatch && setPersonnelMatch[1]) {
                    anyToolProcessed = true;
                    const changesContent = setPersonnelMatch[1].trim();
                    displayHtmlParts.push(marked.parse(`Agent 提议更新人员信息:\n\`\`\`\n${changesContent}\n\`\`\``));
                    
                    if (changesContent && changesContent.toLowerCase() !== '没有变化') {
                        updatePersonnelTable(changesContent);
                        showInPageNotification('Agent 已更新人员信息表。', 'success');
                    } else {
                        showInPageNotification('Agent 表示人员信息没有变化。', 'info');
                    }
                }

                // 3. 检查 <SetSeatTable>
                const setSeatTableMatch = accumulatedAiResponse.match(/<SetSeatTable>([\s\S]*?)<\/SetSeatTable>/i);
                if (setSeatTableMatch && setSeatTableMatch[1]) {
                    anyToolProcessed = true;
                    let fullTableContent = setSeatTableMatch[1].trim();
                    let unarrangedPersonnel = "";
                    
                    const unarrangedMatch = responseForHistory.match(/<\/SetSeatTable>\s*\n*未安排人员：(.*)/i);
                    if (unarrangedMatch && unarrangedMatch[1]) {
                        unarrangedPersonnel = unarrangedMatch[1].trim();
                    }

                    let displayHtml = `Agent 生成了新的座位表: <br><pre>${fullTableContent.replace(/</g, "<").replace(/>/g, ">")}</pre>`;
                    if (unarrangedPersonnel) {
                        displayHtml += `<br>未安排人员: ${unarrangedPersonnel}`;
                    }
                    displayHtmlParts.push(displayHtml);

                    if (tablePreviewDiv) {
                        tablePreviewDiv.innerHTML = marked.parse(fullTableContent);
                        localStorage.setItem('arranged_seat_table_markdown', fullTableContent);
                        applyGenderColoring();
                        displayOriginalSeatNumbers();
                        openSeatModificationDialog();
                        showInPageNotification('Agent 已生成新的座位表。' + (unarrangedPersonnel ? ` 注意：有未安排人员 (${unarrangedPersonnel})` : ''), 'success');
                    }
                }

                // 4. 检查 <AdjustSeatTable>
                const adjustSeatTableMatch = accumulatedAiResponse.match(/<AdjustSeatTable>([\s\S]*?)<\/AdjustSeatTable>/i);
                if (adjustSeatTableMatch && adjustSeatTableMatch[1]) {
                    anyToolProcessed = true;
                    const adjustmentInstructions = adjustSeatTableMatch[1].trim();
                    displayHtmlParts.push(marked.parse(`Agent 提议微调座位表:\n\`\`\`\n${adjustmentInstructions}\n\`\`\``));

                    const originalFormat = localStorage.getItem('original_seat_format_markdown') || "";
                    let currentArrangedTable = localStorage.getItem('arranged_seat_table_markdown');
                    if (!currentArrangedTable || currentArrangedTable.trim() === "") {
                        currentArrangedTable = originalFormat;
                    }
                    
                    const { newSeatTableMarkdown, changesSummary } = processSeatChanges(`<seat_changes>${adjustmentInstructions}</seat_changes>`, currentArrangedTable, originalFormat);

                    if (newSeatTableMarkdown) {
                        tablePreviewDiv.innerHTML = marked.parse(newSeatTableMarkdown);
                        localStorage.setItem('arranged_seat_table_markdown', newSeatTableMarkdown);
                        applyGenderColoring();
                        displayOriginalSeatNumbers();
                        showInPageNotification('Agent 已微调座位表。', 'success');
                        if (seatModificationOutput) {
                            seatModificationOutput.innerHTML = `<strong>Agent 应用的修改:</strong><br><pre>${changesSummary}</pre>`;
                            seatModificationOutput.style.display = 'block';
                        }
                    } else if (changesSummary) {
                        showInPageNotification('Agent 的微调指令未能完全应用或包含说明。请查看座位微调区域的详细信息。', changesSummary.toLowerCase().includes('[错误]') || changesSummary.toLowerCase().includes('[警告]') ? 'warning' : 'info');
                         if (seatModificationOutput) {
                            seatModificationOutput.innerHTML = `<strong>Agent 指令处理结果:</strong><br><pre>${changesSummary}</pre>`;
                            seatModificationOutput.style.display = 'block';
                        }
                    } else {
                        showInPageNotification('Agent 的微调指令未产生变化或无法解析。', 'warning');
                    }
                }

                // 更新UI和历史记录
                if (anyToolProcessed) {
                    if (aiMessageContentDiv) {
                        aiMessageContentDiv.innerHTML = displayHtmlParts.join('<hr style="margin: 10px 0; border-top: 1px solid #ccc;">');
                    }
                    agentConversationHistory.push({ role: 'assistant', content: responseForHistory });
                } else {
                    // 没有处理任何工具，视为纯文本
                    if (responseForHistory) {
                        // UI已在流式处理中更新
                        agentConversationHistory.push({ role: 'assistant', content: responseForHistory });
                    } else {
                        if (aiMessageContentDiv && !aiMessageContentDiv.innerHTML.trim()) {
                            aiMessageContentDiv.innerHTML = marked.parse('*AI 未返回任何内容。*');
                        }
                        agentConversationHistory.push({ role: 'assistant', content: '<!-- AI_EMPTY_RESPONSE -->' });
                    }
                }
            }
            // --- 结束 Agent 响应解析逻辑 ---


        } catch (error) { // 内部 catch
            console.error('[Agent] Inner API/Streaming Error:', error); // 日志5
            if (aiMessageContentDiv) {
                aiMessageContentDiv.innerHTML = marked.parse(`错误 (内部): ${error.message}`);
            } else {
                addAgentMessage('assistant', `处理回复时出错 (内部): ${error.message}`);
            }
            showInPageNotification(`Agent调用失败 (内部): ${error.message}`, 'error');
        } 
    } catch (error) { // 外部 catch
        console.error('[Agent] Outer sendAgentMessage Error:', error); // 日志6
        if (aiMessageContentDiv) { // 确保即使在外部捕获错误时也尝试更新UI
            aiMessageContentDiv.innerHTML = marked.parse(`错误 (外部): ${error.message}`);
        } else {
            addAgentMessage('assistant', `Agent消息发送失败 (外部): ${error.message}`);
        }
        showInPageNotification(`Agent消息发送失败 (外部): ${error.message}`, 'error');
    } finally { 
        console.log("[Agent] Finally block reached."); // 日志7
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

    let roleLabel = 'Agent'; // Default
    let specificClass = 'agent-message-assistant';

    if (role === 'user') {
        roleLabel = '用户';
        specificClass = 'user-message';
    } else if (role === 'system-notification') {
        roleLabel = '系统通知';
        specificClass = 'system-notification-message'; // New class for styling
    }
    // 'assistant' role will use the default roleLabel 'Agent' and specificClass 'agent-message-assistant'

    messageDiv.className = `agent-message ${specificClass}`;
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'agent-message-header';
    headerDiv.innerHTML = `<strong>${roleLabel}</strong> <span class="agent-message-time">${timestamp}</span>`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'agent-message-content';
    
    if (role === 'system-notification') {
        // For system notifications, we might want to display content as plain text or simple HTML, not full Markdown.
        // Let's assume content is pre-formatted or simple text.
        contentDiv.innerHTML = content; // Or escape HTML if content is purely text: contentDiv.textContent = content;
    } else if (content.includes('AI 正在思考中...') || (content.startsWith('<strong>AI 思考过程:</strong>'))) {
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
