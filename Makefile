include $(TOPDIR)/rules.mk

PKG_NAME:=ssid-auto
PKG_VERSION:=1.1
# [修改] 自动生成发布号
PKG_RELEASE:=$(shell git rev-list --count HEAD 2>/dev/null || echo 1)

PKG_MAINTAINER:=Your Name <your@email.com>
PKG_LICENSE:=GPL-3.0
# [新增] 许可证文件声明
PKG_LICENSE_FILES:=LICENSE

# [修改] 增强依赖项
DEPENDS:= \
    +lua \
    +luci-base \
    +luci-compat \
    +luci-lib-json \
    +luci-lib-httpclient \
    +iw @(!TARGET_bcm53xx&&!TARGET_bcm27xx) \
    +iwinfo @(TARGET_bcm53xx||TARGET_bcm27xx) \
    +hostapd-utils

# [新增] LuCI应用元数据
LUCI_TITLE:=WiFi Auto Switch (2.4G/5G)
LUCI_DEPENDS:=+luci-lib-ip +luci-lib-nixio
LUCI_PKGARCH:=all

include $(INCLUDE_DIR)/package.mk
# [新增] LuCI集成支持
include $(INCLUDE_DIR)/luci.mk

define Package/ssid-auto
  SECTION:=net
  CATEGORY:=Network
  SUBMENU:=Wireless
  TITLE:=Auto WiFi Switch with iw/iwinfo support
  URL:=https://github.com/hzy306016819/ssid-auto
  PKGARCH:=all
  # [新增] 用户权限设置
  USERID:=ssidauto:ssidauto
endef

# [修改] 更详细的描述
define Package/ssid-auto/description
  Intelligent switching between 2.4G (M450M) and 5G (ASUS_5G) networks.
  Features include:
  - Dual-band threshold-based switching
  - MAC whitelist support
  - Hybrid iw/iwinfo backend
  - Real-time status monitoring
endef

# [新增] 配置文件声明
define Package/ssid-auto/conffiles
/etc/config/ssid-auto
/usr/bin/ssid-auto
endef

define Build/Configure
endef

define Build/Compile
endef

define Package/ssid-auto/install
    # [未修改] 配置文件安装
    $(INSTALL_DIR) $(1)/etc/config
    $(INSTALL_CONF) ./files/etc/config/ssid-auto $(1)/etc/config/
    
    # [未修改] 热插拔脚本
    $(INSTALL_DIR) $(1)/etc/hotplug.d/iface
    $(INSTALL_BIN) ./files/etc/hotplug.d/iface/99-ssid-auto $(1)/etc/hotplug.d/iface/
    
    # [未修改] Init脚本
    $(INSTALL_DIR) $(1)/etc/init.d
    $(INSTALL_BIN) ./files/etc/init.d/ssid-auto $(1)/etc/init.d/
    
    # [修改] LuCI路径规范化
    $(INSTALL_DIR) $(1)/usr/lib/lua/luci/controller
    $(INSTALL_DATA) ./files/usr/lib/lua/luci/controller/ssid-auto.lua $(1)/usr/lib/lua/luci/controller/
    
    $(INSTALL_DIR) $(1)/usr/lib/lua/luci/model/cbi
    $(INSTALL_DATA) ./files/usr/lib/lua/luci/model/cbi/ssid-auto/settings.lua $(1)/usr/lib/lua/luci/model/cbi/
    
    # [新增] 主程序安装校验
    $(INSTALL_DIR) $(1)/usr/bin
    $(INSTALL_BIN) ./src/ssid-auto.sh $(1)/usr/bin/ssid-auto
    $(SED) 's|#!/bin/sh|#!/bin/sh\n# DO NOT EDIT! Managed by OpenWrt package|' $(1)/usr/bin/ssid-auto
    
    # [新增] 驱动兼容性数据
    $(INSTALL_DIR) $(1)/usr/share/ssid-auto
    $(INSTALL_DATA) ./src/driver-compat.list $(1)/usr/share/ssid-auto/
    
    # [新增] 安装后配置
    $(INSTALL_DIR) $(1)/etc/uci-defaults
    $(INSTALL_BIN) ./files/etc/uci-defaults/40-enable-ssid-auto $(1)/etc/uci-defaults/
endef

# [新增] 安装后脚本
define Package/ssid-auto/postinst
#!/bin/sh
[ -n "$$IPKG_INSTROOT" ] || {
    # 首次安装时启用服务
    /etc/init.d/ssid-auto enable >/dev/null 2>&1
    echo "Please configure /etc/config/ssid-auto then run: /etc/init.d/ssid-auto start"
}
exit 0
endef

$(eval $(call BuildPackage,ssid-auto))
# [新增] LuCI包构建
$(eval $(call BuildLuciPackage,ssid-auto))
