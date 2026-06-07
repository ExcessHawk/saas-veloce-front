import { describe, it, expect } from 'vitest';

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './card';
import { Label } from './label';
import { Textarea } from './textarea';
import { Checkbox } from './checkbox';
import { Switch } from './switch';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuGroup,
} from './dropdown-menu';
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage,
} from './form';

// Import-only smoke test: validates the new primitives resolve their imports
// (radix-ui namespaces, lucide, cn) and are valid components. No rendering, so
// it's independent of the JSX-runtime test config.
describe('ui primitives barrel', () => {
  it('exports valid component functions', () => {
    for (const C of [
      Card, CardHeader, CardTitle, CardContent, CardFooter, Label, Textarea, Checkbox, Switch,
      Avatar, AvatarImage, AvatarFallback, Tabs, TabsList, TabsTrigger, TabsContent,
      DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
      DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuGroup,
      Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage,
    ]) {
      expect(typeof C).toBe('function');
    }
  });
});
