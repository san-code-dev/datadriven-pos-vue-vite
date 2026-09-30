// src/types/workflow/schema.type.ts
import type { BaseOptions, BaseQueueItem } from './common.type';

// =========================================================================
// 1. LAYER KOLOM SCHEMA
// =========================================================================

export interface BaseColumnSchema<T = any> {
    key: (keyof T & string) | (string & {});
    label: string;
    highlight?: boolean;
    validation?: any;
    size?: number;
    isHidden?: boolean;
}

export interface PrimaryColumnSchema<T = any> extends BaseColumnSchema<T> {
    primary: true;
    readonly: true;
    nullable: false;
    required?: boolean;
    type?: 'text' | 'number' | string;
    formula?: never;
    options?: never;
    relation?: never;
}

export interface DisplayColumnSchema<T = any> extends BaseColumnSchema<T> {
    type: 'display';
    required: true;
    readonly: true;
    nullable?: boolean;
    primary?: never;
    formula?: never;
    options?: never;
    relation?: never;
}

export interface RelationColumnSchema<T = any> extends BaseColumnSchema<T> {
    type: 'relation';
    entity: string;
    entityKey: string;
    primary?: boolean;
    readonly?: boolean;
    required?: boolean;
    nullable?: boolean;
    formula?: never;
    options?: never;
}

export interface SelectColumnSchema<T = any> extends BaseColumnSchema<T> {
    type: 'select';
    options: BaseOptions[];
    primary?: boolean;
    readonly?: boolean;
    required?: boolean;
    nullable?: boolean;
    formula?: never;
    relation?: never;
}

export interface StandardColumnSchema<T = any> extends BaseColumnSchema<T> {
    type?: 'text' | 'number' | 'date' | 'boolean' | 'currency' | 'textarea';
    primary?: false;
    readonly?: boolean;
    required?: boolean;
    nullable?: boolean;
    formula?: never;
    options?: never;
    relation?: never;
}

export type RawColumnSchema<T = any> =
    | PrimaryColumnSchema<T>
    | DisplayColumnSchema<T>
    | RelationColumnSchema<T>
    | SelectColumnSchema<T>
    | StandardColumnSchema<T>;

export type ColumnSchema<T = any> = RawColumnSchema<T>;

// =========================================================================
// 2. STRICT UNIQUE COLUMN ARRAY VALIDATOR (TUPLE LEVEL)
// =========================================================================

type CheckDuplicate<T, Acc extends string, Rest extends readonly any[]> =
    Rest extends readonly [infer Head, ...infer Tail]
    ? Head extends { key: infer K extends string }
    ? K extends Acc
    ? `ERROR: Duplicate key '${K}' found in schema!`
    : CheckDuplicate<T, Acc | K, Tail>
    : CheckDuplicate<T, Acc, Tail>
    : Rest;

export type UniqueColumnArray<T, Arr extends readonly ColumnSchema<T>[]> =
    CheckDuplicate<T, never, Arr>;

// =========================================================================
// 3. LAYER MODUL SCHEMA (BLUEPRINT FOR FRONTEND RENDERING)
// =========================================================================

export interface Queue<Q = BaseQueueItem, Arr extends readonly ColumnSchema<Q>[] = readonly ColumnSchema<Q>[]> {
    label: string;
    schema: UniqueColumnArray<Q, Arr>;
    data?: Q[];
}

export interface MasterSchema<T = any, Arr extends readonly ColumnSchema<T>[] = readonly ColumnSchema<T>[]> {
    icon?: string;
    key: string;
    label: string;
    type: 'master';
    isMenuHidden: boolean;
    permissions: { create: boolean; edit: boolean; delete: boolean;[key: string]: boolean };
    actions?: Array<{ key: string; label: string; type: string }>;
    schema: UniqueColumnArray<T, Arr>;
    data?: T[];
}

export interface TransactionSchema<
    H = any,
    D = any,
    Q = BaseQueueItem,
    HArr extends readonly ColumnSchema<H>[] = readonly ColumnSchema<H>[],
    DArr extends readonly ColumnSchema<D>[] = readonly ColumnSchema<D>[]
> {
    icon?: string;
    key: string;
    label: string;
    prefix: string;
    type: 'transaction';
    isMenuHidden: boolean;
    permissions: { create: boolean; edit: boolean; delete: boolean;[key: string]: boolean };
    actions?: Array<{ key: string; label: string; type: string }>;
    queue: Queue<Q>;
    header: {
        label: string;
        schema: UniqueColumnArray<H, HArr>;
        data?: H | null;
    };
    details: {
        label: string;
        schema: UniqueColumnArray<D, DArr>;
        data?: D[];
    };
}