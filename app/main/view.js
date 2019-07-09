'use strict';

const { BrowserView } = require('electron');
const ConfigUtil = require('./../renderer/js/utils/config-util.js');

const shouldSilentWebview = ConfigUtil.getConfigItem('silent');

class View extends BrowserView {
	constructor(props){
		super({
			webPreferences: {
				preload: props.preload ? `${__dirname}/../renderer/js/preload.js` : '',
				nodeIntegration: props.nodeIntegration,
				partition: 'persist:view',
				plugins: true
			}
		});
		this.props = props;
		this.index = props.index;
		this.url = props.url;
		this.zoomFactor = 1.0;
		this.loading = true;
		this.badgeCount = 0;
		this.customCSS = ConfigUtil.getConfigItem('customCSS');

		this.registerListeners();
	}

	registerListeners() {
		if (shouldSilentWebview) {
			this.webContents.addListener('dom-ready', () => {
				this.webContents.setAudioMuted(true);
			});
		}

	}

	zoomIn() {
		this.zoomFactor += 0.1;
		this.webContents.setZoomFactor(this.zoomFactor);
	}

	zoomOut() {
		this.zoomFactor -= 0.1;
		this.webContents.setZoomFactor(this.zoomFactor);
	}

	zoomActualSize() {
		this.zoomFactor = 1.0;
		this.webContents.setZoomFactor(this.zoomFactor);
	}

	reload() {
		this.loading = true;
		this.webContents.reload();
	}

	forward() {
		if (this.webContents.canGoForward()) {
			this.webContents.goForward();
		}
	}

	back() {
		if (this.webContents.canGoBack()) {
			this.webContents.goBack();
		}
	}

	logOut() {
		this.webContents.executeJavaScript('logout()');
	}

	showShortcut() {
		this.webContents.executeJavaScript('shortcut()');
	}

	openDevTools() {
		this.webContents.toggleDevTools();
	}
}

module.exports = View;