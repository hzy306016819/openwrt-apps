# 自由软件，遵循Apache License, Version 2.0
# Copyright (C) 2025 wsk170 <wsk170@gmail.com>

include $(TOPDIR)/rules.mk

LUCI_TITLE:=系统状态监控组件
LUCI_DEPENDS:=+luci-base

PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=wsk170 <wsk170@gmail.com>
PKG_VERSION:=1.0.2
PKG_RELEASE:=1

include $(TOPDIR)/feeds/luci/luci.mk

# 调用BuildPackage生成OpenWrt软件包
