# 这是自建仓库：https://github.com/hzy306016819/openwrt-apps
## **1. 仓库目录**
### 1.Makefile 是一个空文件
```Makefile
include $(TOPDIR)/rules.mk
如果目录不存在或为空，说明插件未正确放置。重新执行：
```
2.仓库添加插件
把需要添加的插件源码及依赖上传。例如：添加luci-app-aliyundrive-webdav
把luci-app-aliyundrive-webdav整个文件夹和他的依赖aliyundrive-webdav都要上传到仓库。

3.查看 aliyundrive-webdav 插件依赖的方法
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


## **2. 修复配置不同步警告**
运行以下命令同步配置：要选择*
```
make menuconfig
```
直接保存退出（不修改任何配置），或运行：
```
make defconfig
```

## **3. 重新尝试编译**
如果插件路径正确，直接编译（无需先 `clean`）：
```
make package/feeds/luci/luci-app-overview-widgets/compile V=s
```
如果仍失败，强制重新编译：
```
make package/feeds/luci/luci-app-overview-widgets/{clean,compile} V=s
```


