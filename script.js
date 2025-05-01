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
const copyTableButton = document.getElementById('copy-table');
const tablePreviewDiv = document.getElementById('table-preview');

let apiKey = localStorage.getItem('deepseek_api_key');
let conversationHistory = [];
let personnelTableMarkdown = localStorage.getItem('personnel_table_markdown') || '';

// 加载时填充已保存的 API 密钥
if (apiKey) {
    apiKeyInput.value = apiKey;
}

// 加载时显示已保存的人员信息表
if (personnelTableMarkdown) {
    markdownOutputDiv.innerHTML = marked.parse(personnelTableMarkdown);
}

// 保存 API 密钥
saveKeyButton.addEventListener('click', () => {
    apiKey = apiKeyInput.value.trim();
    if (apiKey) {
        localStorage.setItem('deepseek_api_key', apiKey);
        alert('API 密钥已保存！');
        // 保存后自动折叠API密钥板块
        apiKeySection.classList.add('api-key-collapsed');
        toggleApiKeyButton.textContent = '展开';
        apiKeyInput.style.display = 'none';
        saveKeyButton.style.display = 'none';
    } else {
        alert('请输入有效的 API 密钥。');
    }
});

// 折叠/展开 API 密钥板块
function toggleApiKeySection() {
    if (apiKeySection.classList.contains('api-key-collapsed')) {
        apiKeySection.classList.remove('api-key-collapsed');
        toggleApiKeyButton.textContent = '折叠';
        apiKeyInput.style.display = 'block';
        saveKeyButton.style.display = 'inline-block';
    } else {
        apiKeySection.classList.add('api-key-collapsed');
        toggleApiKeyButton.textContent = '展开';
        apiKeyInput.style.display = 'none';
        saveKeyButton.style.display = 'none';
    }
}

// 绑定折叠/展开按钮事件
toggleApiKeyButton.addEventListener('click', toggleApiKeySection);

// 页面加载时检查是否已保存API密钥，如果已保存则折叠板块
window.addEventListener('load', () => {
    if (localStorage.getItem('deepseek_api_key')) {
        apiKeySection.classList.add('api-key-collapsed');
        toggleApiKeyButton.textContent = '展开';
        apiKeyInput.style.display = 'none';
        saveKeyButton.style.display = 'none';
    }
    const label = apiKeySection.querySelector('label');
    if (label) {
        label.appendChild(toggleApiKeyButton);
    }
});

// 发送描述给 AI
sendDescriptionButton.addEventListener('click', async () => {
    const description = personDescriptionInput.value.trim();
    apiKey = apiKeyInput.value.trim(); // 确保使用最新的密钥

    if (!apiKey) {
        alert('请先输入并保存您的 DeepSeek API 密钥。');
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
你的任务是根据用户提供的人物描述信息生成或更新一个markdown表格，记录人员信息和每个人的特点。表格应包含三列：人物、性别、备注。

markdown表格规范如下：

- 表格由表头和数据行组成。
- 表头和数据行用竖线（|）分隔不同列。
- 表头和数据行之间用至少三个连字符（---）分隔。

示例如下：

| 人物 | 性别 | 备注 |
| --- | --- | --- |
| 张三 | 男 | 性格开朗，擅长前端开发 |
| 李四 | 女 | 工作认真 |

具体操作步骤如下：

- 当首次接收到人物描述时，根据描述生成一个新的markdown表格。
- 当再次接收到人物描述时，检查描述中的人物是否已在表格中。如果已存在，则更新其性别和备注信息；如果不存在，则在表格中添加新的一行记录该人物信息。
- 你应当总结描述中的信息，包括人物的性格特点和人物之间的关系等，然后简洁明了的填写备注。
- 你可以选择性的忽略一些无关紧要的人物信息，但绝不能遗漏任何人物。

请在<output_table>标签内输出生成或更新后的markdown表格。
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
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
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
                            // 实时渲染流式传输的内容
                            markdownOutputDiv.innerHTML = marked.parse(accumulatedContent);
                        }
                    } catch (e) {
                        console.error('解析 SSE 数据块时出错:', e, '数据块:', jsonData);
                    }
                }
            }
        }

        // 流结束后，确保最终的 Markdown 被渲染
        const finalTableMatch = accumulatedContent.match(/<output_table>([\s\S]*?)<\/output_table>/i);
        if (finalTableMatch && finalTableMatch[1]) {
            const finalMarkdown = finalTableMatch[1].trim();
            markdownOutputDiv.innerHTML = marked.parse(finalMarkdown);
            // 将最终的Markdown表格存储到本地存储
            localStorage.setItem('personnel_table_markdown', finalMarkdown);
            // 将 AI 的完整响应（包括标签）添加到历史记录中
            conversationHistory.push({ role: 'assistant', content: accumulatedContent });
        } else {
            // 如果最终没有有效的表格输出
            markdownOutputDiv.innerHTML = '<p>AI 未能按预期格式返回表格。</p>';
            console.error('未能从 AI 响应中提取表格:', accumulatedContent);
            // 移除最后一次无效的用户输入和可能的系统提示（如果是第一次）
            conversationHistory.pop(); // 移除 user message
            if(conversationHistory.length > 0 && conversationHistory[conversationHistory.length-1].role === 'system') {
                conversationHistory.pop(); // 移除 system prompt if it was the only other message
            }
        }

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
        // 不要清空输入框，保留用户输入
    }
});


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
    localStorage.setItem('seat_table_markdown', markdownTable);
    
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
    apiKey = apiKeyInput.value.trim(); // 确保使用最新的密钥
    const remarks = arrangementRemarksInput.value.trim();
    const personnelTable = localStorage.getItem('personnel_table_markdown') || markdownOutputDiv.innerText; // 从localStorage或DOM获取
    const seatTableFormat = localStorage.getItem('seat_table_markdown') || tablePreviewDiv.innerText; // 从localStorage或DOM获取

    if (!apiKey) {
        alert('请先输入并保存您的 DeepSeek API 密钥。');
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
    tablePreviewDiv.innerHTML = '<p>AI 正在编排座位...</p>'; // 提示用户
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
以下是座位表格式，你需要将表格中“座位一，座位二…”的信息替换为人物表中的人物，不修改表格其他内容：
<座位表格式>
${seatTableFormat}
</座位表格式>
- 如果我提供的人物表中的人数不足以填满座位表，请在表格中用“空座位”替代。
- 如果我提供的人物表中的人数超过了座位表的座位数，并没有被编排进去的人请在表格中用“人物（未被编排）”注明。

请在<编排好的座位表>标签内输出修改后的表格。
`;

    try {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-reasoner',
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
                        const delta = parsedData.choices[0]?.delta?.content;
                        if (delta) {
                            accumulatedContent += delta;

                            // 检查是否有 reasoning_content 或 content
                            const reasoningContent = parsedData.choices[0]?.delta?.reasoning_content;
                            const outputContent = parsedData.choices[0]?.delta?.content;
                            
                            if (reasoningContent) {
                                thinkingContent += reasoningContent;
                                aiThinkingPre.textContent = thinkingContent;
                                aiThinkingOutputDiv.style.display = 'block'; // 确保显示思考过程区域
                            }
                            
                            if (outputContent) {
                                finalTableContent += outputContent;
                                if (finalTableContent.trim()) {
                                    tablePreviewDiv.innerHTML = marked.parse(finalTableContent); // 实时显示表格部分
                                }
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
            tablePreviewDiv.innerHTML = marked.parse(finalTableContent);
            localStorage.setItem('arranged_seat_table_markdown', finalTableContent); // 保存编排后的表格
            // 可以选择隐藏思考过程区域
            aiThinkingOutputDiv.style.display = 'none';
            // 应用性别着色
            applyGenderColoring();
        } else {
            tablePreviewDiv.innerHTML = '<p>AI 未能按预期格式返回编排好的座位表。</p>';
            console.error('未能从 AI 响应中提取编排好的座位表:', accumulatedContent);
            aiThinkingOutputDiv.style.display = 'block'; // 保留思考过程以供调试
        }

    } catch (error) {
        console.error('调用 DeepSeek API 进行座位编排时出错:', error);
        tablePreviewDiv.innerHTML = `<p style="color: red;">座位编排失败: ${error.message}</p>`;
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

// 复制座位列表表格
copyTableButton.addEventListener('click', () => {
    const markdownTable = localStorage.getItem('seat_table_markdown') || '';
    if (markdownTable) {
        navigator.clipboard.writeText(markdownTable).then(() => {
            alert('表格已复制到剪贴板！');
        }, () => {
            alert('复制失败，请手动复制表格内容。');
        });
    } else {
        alert('请先生成表格。');
    }
});
