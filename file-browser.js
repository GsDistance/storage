document.addEventListener('DOMContentLoaded', () => {
    const fileList = document.getElementById('file-list');
    
    // Function to fetch and display directory contents
    async function fetchDirectoryContents() {
        try {
            const response = await fetch('directory-contents.json');
            const contents = await response.json();
            
            // Clear existing list
            fileList.innerHTML = '';
            
            // Create list items for each file/folder
            contents.forEach(item => {
                const listItem = document.createElement('li');
                listItem.classList.add('file-item');
                
                // Add icon based on type
                const icon = document.createElement('span');
                icon.classList.add('file-icon');
                icon.textContent = item.is_dir ? '📁' : '📄';
                listItem.appendChild(icon);
                
                // Add name
                const nameSpan = document.createElement('span');
                nameSpan.textContent = item.name;
                listItem.appendChild(nameSpan);
                
                // Add size for files
                if (!item.is_dir && item.size_bytes) {
                    const sizeSpan = document.createElement('span');
                    sizeSpan.classList.add('file-size');
                    sizeSpan.textContent = `${(item.size_bytes / 1024).toFixed(1)} KB`;
                    listItem.appendChild(sizeSpan);
                }
                
                // Add click handler to potentially open/download
                listItem.addEventListener('click', () => {
                    if (!item.is_dir) {
                        // For files, trigger download
                        const link = document.createElement('a');
                        link.href = item.name;
                        link.download = item.name;
                        link.click();
                    }
                });
                
                fileList.appendChild(listItem);
            });
        } catch (error) {
            console.error('Error fetching directory contents:', error);
            fileList.innerHTML = '<li>Error loading files</li>';
        }
    }
    
    // Initial fetch
    fetchDirectoryContents();
    
    // Optional: Add refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', fetchDirectoryContents);
    }
});
