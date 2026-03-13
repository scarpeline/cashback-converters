import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export function LanguageSelector() {
    const changeLanguage = (lng: string) => {
        // Store language preference in localStorage and reload
        localStorage.setItem('i18n-language', lng);
        window.location.reload();
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-9 px-0">
                    <Globe className="h-[1.2rem] w-[1.2rem] text-muted-foreground" />
                    <span className="sr-only">Trocar Idioma</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => changeLanguage('pt')}>
                    Português (BR)
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => changeLanguage('en')}>
                    English
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => changeLanguage('es')}>
                    Español
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => changeLanguage('fr')}>
                    Français
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
