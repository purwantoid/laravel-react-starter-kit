'use client';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { useRoles } from '@/pages/roles/context/roles-context';
import { Permission, Role } from '@/pages/roles/data/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z.object({
    name: z.string().min(1, { message: 'Role name is required' }),
    guard_name: z.string().min(1, { message: 'Guard name is required' }),
    isEdit: z.boolean(),
});

type RoleForm = z.infer<typeof formSchema>;

interface Props {
    currentRow?: Role;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type Module = {
    model: string;
    permissions: Permission[];
};

export function RolesActionDialog({ currentRow, open, onOpenChange }: Props) {
    const isEdit = !!currentRow;
    const form = useForm<RoleForm>({
        resolver: zodResolver(formSchema),
        defaultValues: isEdit
            ? {
                  ...currentRow,
                  isEdit,
              }
            : {
                  name: '',
                  guard_name: '',
                  isEdit,
              },
    });

    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(false);
    const { setShouldReload } = useRoles();
    useEffect(() => {
        if (open) {
            setLoading(true);
            fetch('/dashboard/roles/permissions')
                .then((res) => res.json())
                .then((data: Record<string, Permission[]>) => {
                    const module: Module[] = Object.entries(data).map(
                        ([model, permissions]) => ({
                            model,
                            permissions,
                        }),
                    );
                    setModules(module);
                })
                .catch((err) => {
                    console.error(err);
                })
                .finally(() => setLoading(false));
        }
    }, [open]);

    useEffect(() => {
        if (modules.length === 0) return;
        const init: Record<string, boolean> = {};
        modules.forEach((m) => {
            m.permissions.forEach((p) => {
                const key = `${m.model}.${p.id}`;
                init[key] =
                    isEdit &&
                    currentRow?.permissions?.some((rp) => rp.id === p.id);
            });
        });

        setSelected(init);
    }, [modules, isEdit, currentRow, loading]);

    const [selected, setSelected] = useState<Record<string, boolean>>(() => {
        const init: Record<string, boolean> = {};
        modules.forEach((m) =>
            m.permissions.forEach((p) => {
                init[`${m.model}.${p.id}`] = false;
            }),
        );
        return init;
    });

    // controlled open/close per module
    const [openMap, setOpenMap] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(modules.map((m) => [m.model, true])),
    );

    const toggleModuleOpen = (model: string, next: boolean) =>
        setOpenMap((p) => ({ ...p, [model]: next }));

    const permId = (m: Module, p: Permission) => `${m.model}.${p.id}`;

    const togglePermission = (id: string) =>
        setSelected((p) => ({ ...p, [id]: !p[id] }));

    const isAllSelected = (m: Module) =>
        m.permissions.every((p) => selected[permId(m, p)]);

    const toggleSelectAllModule = (m: Module) => {
        const all = isAllSelected(m);
        setSelected((prev) => {
            const next = { ...prev };
            m.permissions.forEach((p) => {
                next[permId(m, p)] = !all;
            });
            return next;
        });
    };

    const onSubmit = (values: RoleForm) => {
        form.reset();
        const selectedPermissions = Object.entries(selected)
            .filter(([_, v]) => v)
            .map(([key]) => Number(key.split('.')[1]));

        const payload = {
            ...values,
            permissions: selectedPermissions,
        };

        fetch('/dashboard/roles/store', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN':
                    document.querySelector<HTMLMetaElement>(
                        'meta[name="csrf-token"]',
                    )?.content || '',
            },
            body: JSON.stringify(payload),
        })
            .then((res) => res.json())
            .then((data) => {
                toast({
                    title: 'Role saved successfully',
                    description: (
                        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
                            <code className="text-white">
                                {JSON.stringify(data, null, 2)}
                            </code>
                        </pre>
                    ),
                });
                setShouldReload(true);
                onOpenChange(false);
            })
            .catch((err) => {
                console.error(err);
                toast({
                    title: 'Error',
                    description: 'Failed to save role.',
                    variant: 'destructive',
                });
            });
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(state) => {
                form.reset();
                onOpenChange(state);
            }}
        >
            <DialogContent className="flex h-full max-w-6xl flex-col">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? 'Edit Role' : 'Add Role'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? 'Update the role here. '
                            : 'Create new role here. '}
                        Click save when you&apos;re done.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="-mr-4 w-full flex-1 py-1 pr-4">
                    <Form {...form}>
                        <form
                            id="role-form"
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-4 p-0.5"
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle>Basic Information</CardTitle>
                                    <CardDescription>
                                        Enter the basic details for the new
                                        role.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Role name
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="admin"
                                                            autoComplete="on"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="col-span-4 col-start-3" />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="guard_name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Guard</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="web"
                                                            autoComplete="off"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="col-span-4 col-start-3" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                            <Tabs defaultValue="all">
                                <TabsList>
                                    <TabsTrigger value="all">All</TabsTrigger>
                                    <TabsTrigger value="page">Page</TabsTrigger>
                                    <TabsTrigger value="widget">
                                        Widget
                                    </TabsTrigger>
                                    <TabsTrigger value="custom">
                                        Custom
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent
                                    value="all"
                                    className="mt-4 space-y-4"
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center py-10">
                                            <span className="text-muted-foreground">
                                                Loading permissions...
                                            </span>
                                        </div>
                                    ) : (
                                        modules.map((m) => {
                                            const isOpen = openMap[m.model];
                                            return (
                                                <Collapsible
                                                    key={m.model}
                                                    open={isOpen || true}
                                                    onOpenChange={(v) =>
                                                        toggleModuleOpen(
                                                            m.model,
                                                            v,
                                                        )
                                                    }
                                                >
                                                    <Card>
                                                        <div className="flex items-center justify-between border-b px-4 py-3">
                                                            <CollapsibleTrigger
                                                                asChild
                                                            >
                                                                <button
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        toggleModuleOpen(
                                                                            m.model,
                                                                            !isOpen,
                                                                        );
                                                                    }}
                                                                    className="flex cursor-pointer items-start gap-3"
                                                                    aria-label={`Toggle ${m.model}`}
                                                                    type="button"
                                                                >
                                                                    <div className="text-left">
                                                                        <h3 className="text-base font-semibold">
                                                                            {
                                                                                m.model
                                                                            }
                                                                        </h3>
                                                                        <p className="text-sm text-muted-foreground">
                                                                            {
                                                                                m.model
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </button>
                                                            </CollapsibleTrigger>

                                                            {/* area kanan: Select all + Chevron */}
                                                            <div className="flex items-center gap-3">
                                                                <label
                                                                    className="flex cursor-pointer items-center gap-2 select-none"
                                                                    onClick={(
                                                                        e,
                                                                    ) =>
                                                                        e.stopPropagation()
                                                                    }
                                                                >
                                                                    <Checkbox
                                                                        checked={
                                                                            isAllSelected(
                                                                                m,
                                                                            ) ||
                                                                            false
                                                                        }
                                                                        onCheckedChange={() =>
                                                                            toggleSelectAllModule(
                                                                                m,
                                                                            )
                                                                        }
                                                                    />
                                                                    <span className="text-sm text-muted-foreground">
                                                                        Select
                                                                        all
                                                                    </span>
                                                                </label>
                                                                <div
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        toggleModuleOpen(
                                                                            m.model,
                                                                            !isOpen,
                                                                        );
                                                                    }}
                                                                    className="inline-flex rounded p-1 hover:bg-muted"
                                                                    aria-hidden
                                                                >
                                                                    {isOpen ? (
                                                                        <ChevronUp className="h-5 w-5" />
                                                                    ) : (
                                                                        <ChevronDown className="h-5 w-5" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Content (checkbox grid) */}
                                                        <CollapsibleContent>
                                                            <CardContent className="grid grid-cols-2 gap-3 p-4 md:grid-cols-3 lg:grid-cols-4">
                                                                {m.permissions.map(
                                                                    (p) => {
                                                                        const key =
                                                                            permId(
                                                                                m,
                                                                                p,
                                                                            );
                                                                        return (
                                                                            <label
                                                                                key={
                                                                                    key
                                                                                }
                                                                                className="flex cursor-pointer items-center gap-2 select-none"
                                                                            >
                                                                                <Checkbox
                                                                                    checked={
                                                                                        selected[
                                                                                            key
                                                                                        ] ||
                                                                                        false
                                                                                    }
                                                                                    onCheckedChange={() =>
                                                                                        togglePermission(
                                                                                            key,
                                                                                        )
                                                                                    }
                                                                                />
                                                                                <span>
                                                                                    {
                                                                                        p.name
                                                                                    }
                                                                                </span>
                                                                            </label>
                                                                        );
                                                                    },
                                                                )}
                                                            </CardContent>
                                                        </CollapsibleContent>
                                                    </Card>
                                                </Collapsible>
                                            );
                                        })
                                    )}
                                </TabsContent>
                            </Tabs>
                        </form>
                    </Form>
                </ScrollArea>
                <DialogFooter>
                    <Button type="submit" form="role-form">
                        Save changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
