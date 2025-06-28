# This is free software, licensed under the Apache License, Version 2.0 .
#
# Copyright (C) 2025 wsk170 <wsk170@gmail.com>

include $(TOPDIR)/rules.mk

LUCI_TITLE:=overview widgets for LuCI
LUCI_DEPENDS:=+luci-base

PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=wsk170 <wsk170@gmail.com>
PKG_VERSION:=1.2.0
PKG_RELEASE:=1

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
