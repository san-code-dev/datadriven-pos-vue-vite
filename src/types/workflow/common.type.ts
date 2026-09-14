// src/types/common.type.ts

export interface Options {
    label: string;
    value: string;
}

export interface BaseQueueItem {
    id: number;
    label: string;
}

export interface MenuItem {
    key: string;
    icon: string;
    label: string;
    type: string;
    route: string;
    menuCategory: string;
}