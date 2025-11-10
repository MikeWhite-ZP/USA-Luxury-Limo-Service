#!/usr/bin/env python3

"""
Setup iOS Permissions Script
This script adds required permission descriptions to iOS Info.plist
"""

import os
import sys
import shutil
from pathlib import Path

INFO_PLIST = "ios/App/App/Info.plist"
TEMPLATE = "ios-info-plist-template.xml"

def main():
    # Check if iOS project exists
    if not Path("ios/App/App").is_dir():
        print("❌ Error: iOS project not found at ios/App/App")
        print("Run: npx cap add ios")
        sys.exit(1)
    
    # Check if Info.plist exists
    if not Path(INFO_PLIST).is_file():
        print(f"❌ Error: Info.plist not found at {INFO_PLIST}")
        sys.exit(1)
    
    # Read existing Info.plist
    with open(INFO_PLIST, 'r') as f:
        content = f.read()
    
    # Check if permissions already exist
    if "NSCameraUsageDescription" in content:
        print("✅ Permissions already configured in Info.plist")
        return 0
    
    print("📝 Adding iOS permissions to Info.plist...")
    
    # Read permissions from template
    with open(TEMPLATE, 'r') as f:
        template = f.read()
    
    # Extract permissions block (everything between comments and </array>)
    start_marker = "<!-- Required permissions"
    if start_marker not in template:
        print(f"❌ Error: Could not find permissions in {TEMPLATE}")
        sys.exit(1)
    
    start_idx = template.find(start_marker)
    end_idx = template.find("</array>", start_idx) + len("</array>")
    permissions = template[start_idx:end_idx]
    
    # Backup original file
    shutil.copy2(INFO_PLIST, f"{INFO_PLIST}.bak")
    
    # Find the last </dict> before </plist> and insert permissions before it
    # Split by </plist> to find the content before it
    parts = content.rsplit("</plist>", 1)
    if len(parts) != 2:
        print("❌ Error: Malformed Info.plist (missing </plist>)")
        sys.exit(1)
    
    # Find the last </dict> in the first part
    before_plist = parts[0]
    last_dict_idx = before_plist.rfind("</dict>")
    
    if last_dict_idx == -1:
        print("❌ Error: Malformed Info.plist (missing </dict>)")
        sys.exit(1)
    
    # Insert permissions before the last </dict>
    new_content = (
        before_plist[:last_dict_idx] +
        "\t" + permissions + "\n" +
        before_plist[last_dict_idx:] +
        "</plist>" + parts[1]
    )
    
    # Write modified content
    with open(INFO_PLIST, 'w') as f:
        f.write(new_content)
    
    # Verify permissions were added
    with open(INFO_PLIST, 'r') as f:
        if "NSCameraUsageDescription" in f.read():
            print("✅ Permissions added successfully!")
            print(f"ℹ️  Backup created at: {INFO_PLIST}.bak")
            print()
            print("Permissions added:")
            print("  • Camera access")
            print("  • Photo library access")
            print("  • Location services")
            print("  • Push notifications")
            return 0
        else:
            print("❌ Error: Verification failed")
            shutil.copy2(f"{INFO_PLIST}.bak", INFO_PLIST)
            sys.exit(1)

if __name__ == "__main__":
    sys.exit(main() or 0)
