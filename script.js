class FileBrowser {
    constructor() {
        this.currentPath = '';
        this.fileData = null;
        this.init();
        this.initTheme();
    }

    async init() {
        this.setupEventListeners();
        await this.loadFileData();
        this.renderFileTree();
        this.renderBreadcrumb();
        this.renderFileGrid();
    }

    setupEventListeners() {
        document.getElementById('search').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        document.querySelector('.close-preview').addEventListener('click', () => {
            this.closePreview();
        });
    }

    async loadFileData() {
        try {
            const response = await fetch('/store_contents.json');
            const data = await response.json();
            this.fileData = this.processFileData(data);
            if (Object.keys(this.fileData).length === 0) {
                this.showEmptyState();
            }
        } catch (error) {
            console.error('Error loading file data:', error);
            this.showErrorState();
        }
    }

    processFileData(data) {
        const processedData = {};
        
        // Process each file in the JSON data
        data.files.forEach(file => {
            const pathParts = file.path.split('/');
            let current = processedData;
            
            // Create nested structure for directories
            for (let i = 0; i < pathParts.length - 1; i++) {
                const part = pathParts[i];
                if (!current[part]) {
                    current[part] = {};
                }
                current = current[part];
            }
            
            // Add file with its metadata
            const fileName = pathParts[pathParts.length - 1];
            const fileType = this.getFileTypeFromName(fileName);
            current[fileName] = {
                size: this.formatFileSize(parseInt(file.size)),
                type: fileType,
                modified: file.modified,
                path: file.path
            };
        });
        
        return processedData;
    }

    getFileTypeFromName(fileName) {
        const extension = fileName.split('.').pop().toLowerCase();
        const typeMap = {
            'txt': 'text',
            'md': 'text',
            'pdf': 'pdf',
            'jpg': 'image',
            'jpeg': 'image',
            'png': 'image',
            'gif': 'image',
            'svg': 'svg',
            'mp4': 'video',
            'mov': 'video',
            'mp3': 'audio',
            'wav': 'audio',
            'js': 'code',
            'py': 'code',
            'html': 'code',
            'css': 'code'
        };
        return typeMap[extension] || 'unknown';
    }

    formatFileSize(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 B';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
    }

    renderFileTree(parentEl = document.getElementById('fileTree'), path = '') {
        parentEl.innerHTML = '';
        const currentLevel = path ? this.getPathContent(path) : this.fileData;

        for (const [name, content] of Object.entries(currentLevel)) {
            const item = document.createElement('div');
            item.className = 'file-tree-item';
            
            const icon = document.createElement('i');
            icon.className = typeof content === 'object' && !content.type 
                ? 'fas fa-folder' 
                : this.getFileIcon(content.type);
            
            item.appendChild(icon);
            item.appendChild(document.createTextNode(name));
            
            item.addEventListener('click', () => {
                const newPath = path ? `${path}/${name}` : name;
                if (typeof content === 'object' && !content.type) {
                    this.currentPath = newPath;
                    this.renderBreadcrumb();
                    this.renderFileGrid();
                } else {
                    this.showPreview(name, content);
                }
            });

            parentEl.appendChild(item);
        }
    }

    renderFileGrid() {
        const grid = document.getElementById('fileGrid');
        grid.innerHTML = '';
        const currentContent = this.getPathContent(this.currentPath);

        for (const [name, content] of Object.entries(currentContent)) {
            const item = document.createElement('div');
            item.className = 'file-item';
            
            const icon = document.createElement('div');
            icon.className = 'file-icon';
            icon.innerHTML = `<i class="${this.getFileIcon(content.type)}"></i>`;
            
            const fileName = document.createElement('div');
            fileName.className = 'file-name';
            fileName.textContent = name;
            
            item.appendChild(icon);
            item.appendChild(fileName);
            
            item.addEventListener('click', () => {
                if (typeof content === 'object' && !content.type) {
                    this.currentPath += (this.currentPath ? '/' : '') + name;
                    this.renderBreadcrumb();
                    this.renderFileGrid();
                } else {
                    this.showPreview(name, content);
                }
            });

            grid.appendChild(item);
        }
    }

    renderBreadcrumb() {
        const breadcrumb = document.getElementById('breadcrumb');
        breadcrumb.innerHTML = '';
        
        const parts = this.currentPath.split('/').filter(Boolean);
        let path = '';

        const home = document.createElement('span');
        home.innerHTML = '<i class="fas fa-home"></i>';
        home.addEventListener('click', () => {
            this.currentPath = '';
            this.renderBreadcrumb();
            this.renderFileGrid();
        });
        breadcrumb.appendChild(home);

        parts.forEach((part, index) => {
            const separator = document.createElement('span');
            separator.innerHTML = ' / ';
            breadcrumb.appendChild(separator);

            const link = document.createElement('span');
            link.textContent = part;
            link.style.cursor = 'pointer';
            path += (path ? '/' : '') + part;
            
            const currentPath = path;
            link.addEventListener('click', () => {
                this.currentPath = currentPath;
                this.renderBreadcrumb();
                this.renderFileGrid();
            });
            
            breadcrumb.appendChild(link);
        });
    }

    getPathContent(path) {
        if (!path) return this.fileData;
        return path.split('/').reduce((acc, part) => acc[part], this.fileData);
    }

    getFileIcon(type) {
        const iconMap = {
            'pdf': 'fas fa-file-pdf',
            'text': 'fas fa-file-alt',
            'image': 'fas fa-file-image',
            'video': 'fas fa-file-video',
            'audio': 'fas fa-file-audio',
            'code': 'fas fa-file-code',
            'svg': 'fas fa-file-vector'
        };
        return iconMap[type] || 'fas fa-file';
    }

    async showPreview(name, fileInfo) {
        const previewContent = document.querySelector('.preview-content');
        const fileInfoPanel = document.querySelector('.file-info');
        
        // Clear previous content
        previewContent.innerHTML = '';
        fileInfoPanel.innerHTML = '';
        
        // Add file info
        fileInfoPanel.innerHTML = `
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Size:</strong> ${fileInfo.size}</p>
            <p><strong>Type:</strong> ${fileInfo.type}</p>
            <p><strong>Modified:</strong> ${fileInfo.modified || 'Unknown'}</p>
            <p><strong>Path:</strong> ${fileInfo.path || this.currentPath + '/' + name}</p>
        `;

        // Show preview based on file type
        if (fileInfo.type === 'image') {
            const img = document.createElement('img');
            img.src = `/store/${fileInfo.path}`;
            previewContent.appendChild(img);
        } else if (fileInfo.type === 'svg') {
            try {
                const response = await fetch(`/store/${fileInfo.path}`);
                const svgText = await response.text();
                
                // Create a container for the SVG with controls
                const container = document.createElement('div');
                container.className = 'svg-preview-container';
                
                // Add the SVG content
                container.innerHTML = `
                    <div class="svg-controls">
                        <button class="zoom-in"><i class="fas fa-search-plus"></i></button>
                        <button class="zoom-reset"><i class="fas fa-undo"></i></button>
                        <button class="zoom-out"><i class="fas fa-search-minus"></i></button>
                    </div>
                    <div class="svg-wrapper">${svgText}</div>
                `;
                
                previewContent.appendChild(container);
                
                // Get the SVG element
                const svg = container.querySelector('svg');
                if (svg) {
                    // Make SVG responsive
                    svg.setAttribute('width', '100%');
                    svg.setAttribute('height', '100%');
                    svg.style.maxHeight = '500px';
                    
                    // Setup zoom controls
                    let currentZoom = 1;
                    const zoomStep = 0.1;
                    const wrapper = container.querySelector('.svg-wrapper');
                    
                    container.querySelector('.zoom-in').addEventListener('click', () => {
                        currentZoom += zoomStep;
                        wrapper.style.transform = `scale(${currentZoom})`;
                    });
                    
                    container.querySelector('.zoom-out').addEventListener('click', () => {
                        currentZoom = Math.max(0.1, currentZoom - zoomStep);
                        wrapper.style.transform = `scale(${currentZoom})`;
                    });
                    
                    container.querySelector('.zoom-reset').addEventListener('click', () => {
                        currentZoom = 1;
                        wrapper.style.transform = 'scale(1)';
                    });
                }
            } catch (error) {
                previewContent.innerHTML = '<p>Error loading SVG preview</p>';
            }
        } else if (fileInfo.type === 'text' || fileInfo.type === 'code') {
            try {
                const response = await fetch(`/store/${fileInfo.path}`);
                const text = await response.text();
                previewContent.innerHTML = `<pre>${text}</pre>`;
            } catch (error) {
                previewContent.innerHTML = '<p>Preview not available</p>';
            }
        } else {
            previewContent.innerHTML = '<p>Preview not available for this file type</p>';
        }
    }

    closePreview() {
        document.querySelector('.preview-content').innerHTML = '';
        document.querySelector('.file-info').innerHTML = '';
    }

    handleSearch(query) {
        // Implement search functionality
        if (!query) {
            this.renderFileTree();
            this.renderFileGrid();
            return;
        }

        const searchResults = this.searchFiles(query);
        this.renderSearchResults(searchResults);
    }

    searchFiles(query) {
        const results = [];
        const search = (obj, path = '') => {
            for (const [name, content] of Object.entries(obj)) {
                const fullPath = path ? `${path}/${name}` : name;
                if (name.toLowerCase().includes(query.toLowerCase())) {
                    results.push({ name, path: fullPath, content });
                }
                if (typeof content === 'object' && !content.type) {
                    search(content, fullPath);
                }
            }
        };
        search(this.fileData);
        return results;
    }

    renderSearchResults(results) {
        const grid = document.getElementById('fileGrid');
        grid.innerHTML = '';

        results.forEach(({ name, path, content }) => {
            const item = document.createElement('div');
            item.className = 'file-item';
            
            const icon = document.createElement('div');
            icon.className = 'file-icon';
            icon.innerHTML = `<i class="${this.getFileIcon(content.type)}"></i>`;
            
            const fileName = document.createElement('div');
            fileName.className = 'file-name';
            fileName.textContent = `${name} (${path})`;
            
            item.appendChild(icon);
            item.appendChild(fileName);
            
            item.addEventListener('click', () => {
                if (typeof content === 'object' && !content.type) {
                    this.currentPath = path;
                    this.renderBreadcrumb();
                    this.renderFileGrid();
                } else {
                    this.showPreview(name, content);
                }
            });

            grid.appendChild(item);
        });
    }

    showEmptyState() {
        const grid = document.getElementById('fileGrid');
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>No files found</h3>
                <p>Add files to your store directory to see them here.</p>
            </div>
        `;
    }

    showErrorState() {
        const grid = document.getElementById('fileGrid');
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error loading files</h3>
                <p>There was a problem loading the file list. Please try again later.</p>
            </div>
        `;
    }

    initTheme() {
        const themeToggle = document.getElementById('themeToggle');
        
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.checked = true;
        }

        // Add theme toggle listener
        themeToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
            }
        });
    }
}

// Initialize the file browser when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FileBrowser();
});