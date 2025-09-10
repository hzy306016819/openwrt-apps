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

