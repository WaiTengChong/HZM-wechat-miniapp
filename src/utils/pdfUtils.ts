import Taro from '@tarojs/taro';
import { I18n } from '../I18n';
import { RemoteSettingsService } from '../services/remoteSettings';

/**
 * Opens a PDF file from a URL, always downloading it fresh
 * @param url The URL of the PDF file to download/open
 * @param title The title to use for the file name
 */
export const openPDF = async () => {
 await RemoteSettingsService.getInstance()
    .initialize()
    .then(() => {
      const url = RemoteSettingsService.getInstance().getString(
        "infoFile_url",
        "https://image.alteronetech.top/image/pdf/info.pdf"
      );
  const title = url.split('/').pop()?.split('.')[0] || 'info';
  const filePath = `${Taro.env.USER_DATA_PATH}/${title}.pdf`;
  
  // Show loading indicator
  Taro.showLoading({
    title: 'Preparing document...',
    mask: true
  });
  
  // Check if file already exists in cache
  Taro.getFileInfo({
    filePath,
    success: (fileInfo) => {
      // File exists, open directly
      Taro.hideLoading();
      Taro.openDocument({
        filePath,
        fileType: "pdf",
      });
    },
    fail: () => {
      // File doesn't exist, download it
      Taro.showLoading({
        title: 'Downloading file...',
        mask: true
      });
      
      const downloadTask = Taro.downloadFile({
        url,
        filePath,
        success: function (res) {
          console.log(res, "res");
          // Hide the loading indicator
          Taro.hideLoading();
          
          Taro.openDocument({
            filePath: res.filePath,
            fileType: "pdf",
          });
        },
        fail: function(err) {
          // Hide the loading indicator and show error
          Taro.hideLoading();
          Taro.showToast({
            title: 'Failed to load file',
            icon: 'error',
            duration: 2000
          });
          console.error('Download failed:', err);
        }
      });
      
      // Monitor download progress
      downloadTask.onProgressUpdate((res) => {
        // Update loading message with progress percentage
        Taro.showLoading({
          title: `${I18n.downloading}: ${res.progress}%`,
          mask: true
        });
        
        // When download is complete, change message
        if (res.progress === 100) {
          Taro.showLoading({
            title: 'Opening document...',
            mask: true
          });
        }
      });
    }
    });
  });
};
