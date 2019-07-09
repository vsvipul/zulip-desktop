'use strict';

const { BrowserWindow, ipcMain } = require('electron');
const View = require('./view.js');
const ConfigUtil = require('./../renderer/js/utils/config-util.js');

class ViewManager {
    constructor(){
        this.views = {};
        this.selectedIndex = 0;
        // this.fullscreen = false;
        this.registerIpcs();
    }

    registerIpcs() {
        ipcMain.on('view-create', (event, props) => {
            this.create(props);
        });
    
        ipcMain.on('view-select', (event, index) => {
            this.select(index);
        });

        ipcMain.on('view-destroy', (event, index) => {
            this.destroy(index);
        });

        ipcMain.on('view-destroy-all', () => {
            this.destroyAll();
        });

        ipcMain.on('forward-message-view', (event, listener, ...params) => {
            this.views[this.selectedIndex].webContents.send(listener, ...params);
        });

        ipcMain.on('view-call-function', (event, name, ...params) => {
            this.views[this.selectedIndex][name]();
        });
    }

    // toggleFullscreen(state) {
    //     this.fullscreen = state;
    //     this.fixBounds();
    // }

    create(props) {
        // const mainWindow = BrowserWindow.getAllWindows()[0];
        if (this.views[props.index]){
            return;
        }
        const view = new View(props);
        this.views[props.index] = view;
        view.webContents.loadURL(props.url);
        console.log('Created view with index '+ props.index + props.url);
        // view.setBackgroundColor('black');
    }

    select(index) {
        const mainWindow = BrowserWindow.getAllWindows()[0];
        if (!mainWindow){
            console.log('Trying to select bw when no window.')
        }
        const view = this.views[index];
        if (!view || view.isDestroyed()){
            console.log('View not found with index '+ index);
            this.destroy(index);
            mainWindow.setBrowserView(null);
            return;
        }
        this.selectedIndex = index;
        console.log('Selected view with index '+ index);
        mainWindow.setBrowserView(null);
        if (!view.webContents.getURL()) {
            console.log('reloading url');
            const url = this.views[this.selectedIndex].url;
            view.webContents.loadURL(url);
        }
        mainWindow.setBrowserView(view);
        view.webContents.focus();
        this.fixBounds();
    }

    fixBounds() {
        const view = this.views[this.selectedIndex];
        const showSidebar = ConfigUtil.getConfigItem('showSidebar', true);
        // const autoHideMenubar = ConfigUtil.getConfigItem('autoHideMenubar', false);

        if (!view || view.isDestroyed()){
            return;
        }
        const mainWindow = BrowserWindow.getAllWindows()[0];
        const { width, height } = mainWindow.getContentBounds();
        // const tmpwidth = 400;
        view.setBounds({
            x: showSidebar ? 54 : 0,
            y: 0,
            width: showSidebar ? width - 54 : width,
            height: height
        });
        view.setAutoResize({ width: true, height: true });
    }

    destroy(index) {
        const mainWindow = BrowserWindow.getAllWindows()[0];
        const view = this.views[index];
        if (!view || view.isDestroyed()){
            console.log('Cant find view to destroy with index '+ index);
            delete this.views[index];
            return;
        }

        if (mainWindow.getBrowserView() === view) {
            mainWindow.setBrowserView(null);
        }

        view.destroy();
        console.log('View destoyed with index '+ index);

        delete this.views[index];
    }

    destroyAll() {
        const mainWindow = BrowserWindow.getAllWindows()[0];
        mainWindow.setBrowserView(null);
        for (const id in this.views) {
            console.log(id, this.views[id].index);
            this.destroy(this.views[id].index);
        }
    }
}

module.exports = new ViewManager();