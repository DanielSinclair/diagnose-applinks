
# diagnose-applinks

Parse iOS sysdiagnose dumps to diagnose Universal Links and AASA fetching problems

## Parsing with `diagnose-applinks`
```
npx diagnose-applinks -b [BUNDLE ID] -s [tar.gz path]
```

```
Usage: diagnose-applinks [options]

Options:
  -b, --bundle <bundle id>         app bundle identifier
  -s, --sysdiagnose <tar.gz path>  path to sysdiagnose tar.gz
  -o, --json                       json output flag
  -h, --help                       display help for command
```

## How to get a sysdiagnose dump from iOS:
*[Read Apple's guide](https://download.developer.apple.com/iOS/iOS_Logs/sysdiagnose_Logging_Instructions.pdf)*
1) Trigger a sysdiagnose by simultaneously pressing and releasing both volume buttons + the Side (or Top) button for 1
to 1.5 seconds.
2) On an iPhone you will feel a short vibration when a sysdiagnose is successfully triggered.
3) Wait 10 minutes for the diagnostic gathering to complete.
4) AirDrop the file to your Mac computer
    - Settings.app > Privacy > Analytics & Improvements > Analytics Data
    - Search for sysdiagnose
    - Airdrop .tar.gz file to mac