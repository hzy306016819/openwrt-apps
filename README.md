# 这是自建仓库：https://github.com/hzy306016819/openwrt-apps
**✨添加插件先在本地编译测试✨** **✨添加插件先在本地编译测试✨**  **✨添加插件先在本地编译测试✨**
## **一.使用**
1.添加库（云编译在diy-part1.sh添加）
```bash
echo 'src-git apps https://github.com/hzy306016819/openwrt-apps' >>feeds.conf.default
```
2.更新库
```bash
./scripts/feeds update -a
```
```bash
./scripts/feeds install -a
```
单独更新apps库
```bash
./scripts/feeds update apps
```
```bash
./scripts/feeds install apps
```
```
make menuconfig
```
3.编译ikp插件

```bash
make package/luci-app-aliyundrive-webdav/compile V=s
```
或（下面的好像不显编译过程）

```bash
make package/aliyundrive-webdav/compile V=s 2>&1 | grep "depends on"
```
这些命令会在编译过程中显示依赖关系。



=====================================================================================================
## **二. 仓库管理**
### 1.Makefile 是一个空文件
```Makefile
include $(TOPDIR)/rules.mk
如果目录不存在或为空，说明插件未正确放置。重新执行：
```
### 2.仓库添加插件
把需要添加的插件源码及依赖上传。例如：添加luci-app-aliyundrive-webdav
把luci-app-aliyundrive-webdav整个文件夹和他的依赖aliyundrive-webdav都要上传到仓库。

### 3.查看 aliyundrive-webdav 插件依赖的方法
找到 aliyundrive-webdav 的 Makefile
在原始仓库中找到 aliyundrive-webdav 目录
打开其中的 Makefile 文件
查看 DEPENDS 字段
在 Makefile 中查找类似这样的内容：
```Makefile
define Package/aliyundrive-webdav
  SECTION:=net
  CATEGORY:=Network
  TITLE:=AliyunDrive WebDAV server
  URL:=https://github.com/messense/aliyundrive-webdav
  DEPENDS:=+libc +libstdcpp +libopenssl +libcurl +zlib
endef
```
DEPENDS 行列出了所有依赖项。
=====================================================================================================
## 三、项目原地址
### 1.阿里云盘drive
https://github.com/messense/aliyundrive-webdav
### 2.adguardhome
https://github.com/rufengsuixing/luci-app-adguardhome
### 3.微信推送（已取消使用）
https://github.com/tty228/luci-app-wechatpush
### 4.全能推送
https://github.com/zzsj0928/luci-app-pushbot
### 5.luci-app-overview-widgets 按恩山大佬的修改
### 6.网络流量监控
https://github.com/timsaya/luci-app-bandix/
=====================================================================================================
### 下面项目再次单个下载
https://github.com/kenzok8/small-package
luci-app-xunlei（迅雷）
luci-app-unishare   （依赖unishare）（共享盘samba4）测试
[luci-app-wolplus
luci-app-wifidog
luci-app-cloudflarespeedtest（依赖cdnspeedtest）cfip优选
luci-app-sunpanel  （依赖sunpanel）导航






