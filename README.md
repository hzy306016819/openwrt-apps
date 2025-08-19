3个功能
状态-端口-无限用户-

### **1. 检查插件路径是否正确**
确保插件克隆到了正确的目录并已被 `feeds` 系统识别：
```
ls -l package/feeds/luci/luci-app-overview-widgets/
```
如果目录不存在或为空，说明插件未正确放置。重新执行：
```
cd immortalwrt-mt798x-24.10
cd package/feeds/luci/
git clone https://github.com/hzy306016819/luci-app-overview-widgets.git
cd ../../..
./scripts/feeds update -a
./scripts/feeds install -a
```

### **2. 修复配置不同步警告**
运行以下命令同步配置：要选择*
```
make menuconfig
```
直接保存退出（不修改任何配置），或运行：
```
make defconfig
```

### **3. 重新尝试编译**
如果插件路径正确，直接编译（无需先 `clean`）：
```
make package/feeds/luci/luci-app-overview-widgets/compile V=s
```
如果仍失败，强制重新编译：
```
make package/feeds/luci/luci-app-overview-widgets/{clean,compile} V=s
```
TypeError
host.mac.toUpperCase is not a function

# 进入工作目录
cd ~/immortalwrt-mt798x-24.10
# 1. 清理并更新golang配置
rm -rf feeds/packages/lang/golang
git clone https://github.com/sbwml/packages_lang_golang -b 24.x feeds/packages/lang/golang

# 2. 直接修改Makefile（关键步骤）
# 删除amd64配置（精确匹配）
sed -i '/ifeq ($(HOST_ARCH),x86_64)/,/endif/d' feeds/packages/lang/golang/golang/Makefile

# 更新关键参数（严格匹配原始格式）
sed -i \
-e 's/^BOOTSTRAP_SOURCE:=.*/BOOTSTRAP_SOURCE:=go1.24.4.linux-$(PKG_ARCH).tar.gz/' \
-e 's/^PKG_HASH:=.*/PKG_HASH:=de2a8220498c51a9e48443d4c0a7b6d947c68331e8a5476a21e030e7acd27a06/' \
-e '/ifeq ($(HOST_ARCH),aarch64)/,/endif/ s/BOOTSTRAP_HASH:=.*/BOOTSTRAP_HASH:=ba0d5a9d25979b8d9c4301cfa4e650d7e9bd1fd0b9c385b4a9e3e6a4a5f6e9e8/' \
-e 's|^GO_SOURCE_URLS:=.*|GO_SOURCE_URLS:=https://mirrors.aliyun.com/golang/ \\\n                https://mirrors.ustc.edu.cn/golang/ \\\n                https://mirrors.nju.edu.cn/golang/|' \
feeds/packages/lang/golang/golang/Makefile


# 3. 处理360T7特殊依赖
rm -rf feeds/packages/net/v2ray-geodata
git clone https://github.com/sbwml/luci-app-mosdns -b v5 package/mosdns
git clone https://github.com/sbwml/v2ray-geodata package/v2ray-geodata

# 4. 预下载（国内镜像加速）
make -j$(nproc) download V=s || {
  wget https://mirrors.aliyun.com/golang/go1.24.4.linux-arm64.tar.gz -O dl/go1.24.4.linux-arm64.tar.gz
  wget https://mirrors.aliyun.com/golang/go1.24.4.src.tar.gz -O dl/go1.24.4.src.tar.gz
}

# 5. 配置和编译
make menuconfig  # 勾选 LuCI -> Applications -> luci-app-mosdns
make package/mosdns/luci-app-mosdns/compile -j1 V=s
