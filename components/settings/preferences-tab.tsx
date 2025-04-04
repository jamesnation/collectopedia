"use client"

import { BugIcon, ImageIcon, GlobeIcon, MoonIcon, SunIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useEbayDebugMode } from "@/hooks/use-ebay-debug-mode"
import { useRegionPreference, RegionCode, REGIONS } from "@/hooks/use-region-preference"
import { Separator } from "@/components/ui/separator"
import { useEffect } from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useTheme } from "next-themes"
import { useAdminCheck } from "@/hooks/use-admin-check"

export function PreferencesTab() {
  const { isDebugMode, isInitialized, toggleDebugMode } = useEbayDebugMode();
  const { region, regionData, isInitialized: isRegionInitialized, changeRegion } = useRegionPreference();
  const { theme, setTheme, systemTheme } = useTheme();
  const { isAdmin, isLoading: isAdminLoading } = useAdminCheck();

  useEffect(() => {
    console.log('PreferencesTab - Debug mode status:', { isDebugMode, isInitialized });
    console.log('PreferencesTab - Region status:', { region, isRegionInitialized });
    console.log('PreferencesTab - Theme status:', { theme, systemTheme });
    console.log('PreferencesTab - Admin status:', { isAdmin, isAdminLoading });
  }, [isDebugMode, isInitialized, region, isRegionInitialized, theme, systemTheme, isAdmin, isAdminLoading]);

  const handleRegionChange = (value: string) => {
    changeRegion(value as RegionCode);
  };

  const handleThemeChange = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  const isDarkMode = theme === 'dark';

  return (
    <div className="space-y-6">
      <Card className="border shadow-sm dark:bg-card/60 dark:border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-foreground">
            {isDarkMode ? (
              <MoonIcon className="h-5 w-5 text-purple-400" />
            ) : (
              <SunIcon className="h-5 w-5 text-amber-400" />
            )}
            Appearance
          </CardTitle>
          <CardDescription className="dark:text-muted-foreground">
            Customize the appearance of the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode" className="flex items-center gap-2">
                Dark Mode
              </Label>
              <p className="text-sm text-muted-foreground">
                Switch between light and dark themes
              </p>
            </div>
            <Switch
              id="dark-mode"
              checked={isDarkMode}
              onCheckedChange={handleThemeChange}
            />
          </div>

          <Separator className="my-4" />
          
          <p className="text-xs text-muted-foreground">
            Theme preferences are stored locally in your browser.
          </p>
        </CardContent>
      </Card>

      <Card className="border shadow-sm dark:bg-card/60 dark:border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-foreground">
            <GlobeIcon className="h-5 w-5 text-blue-400" />
            Region & Currency
          </CardTitle>
          <CardDescription className="dark:text-muted-foreground">
            Set your preferred region and currency for the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <RadioGroup 
              value={region} 
              onValueChange={handleRegionChange}
              disabled={!isRegionInitialized}
              className="flex flex-col space-y-3"
            >
              {Object.entries(REGIONS).map(([code, data]) => (
                <div key={code} className="flex items-center space-x-2">
                  <RadioGroupItem value={code} id={`region-${code}`} />
                  <Label htmlFor={`region-${code}`} className="flex items-center gap-2 cursor-pointer">
                    <span className="font-medium">{data.label}</span>
                    <span className="text-sm text-muted-foreground">
                      ({data.currency} {data.currencyCode})
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            
            <p className="text-sm text-muted-foreground">
              This setting affects both displayed currencies and eBay price estimates.
            </p>
          </div>
          
          <Separator className="my-4" />
          
          <p className="text-xs text-muted-foreground">
            Currency settings are stored locally in your browser.
          </p>
        </CardContent>
      </Card>

      {/* Only show Developer Options for admin users */}
      {isAdmin && (
        <Card className="border shadow-sm dark:bg-card/60 dark:border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-foreground">
              <BugIcon className="h-5 w-5 text-purple-400" />
              Developer Options
            </CardTitle>
            <CardDescription className="dark:text-muted-foreground">
              Advanced features for debugging and development
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="ebay-debug-mode" className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  eBay Image Search Debug
                </Label>
                <p className="text-sm text-muted-foreground">
                  Show matched eBay images when using AI price estimation
                </p>
              </div>
              <Switch
                id="ebay-debug-mode"
                checked={isDebugMode}
                onCheckedChange={toggleDebugMode}
                disabled={!isInitialized}
              />
            </div>
            
            <Separator className="my-4" />
            
            <p className="text-xs text-muted-foreground italic">
              These options are intended for development and debugging purposes only.
              Enabling them may affect application performance.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 