import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Child { 'id' : string, 'name' : string, 'archived' : boolean }
export interface ChildCall { 'name' : string }
export type Error = { 'NotFound' : null } |
  { 'BalanceNotEnough' : null } |
  { 'NotAuthorized' : null } |
  { 'AlreadyExists' : null };
export interface Goal {
  'id' : bigint,
  'value' : bigint,
  'name' : string,
  'archived' : boolean,
}
export interface GoalCall { 'value' : bigint, 'name' : string }
export type Result = { 'ok' : null } |
  { 'err' : Error };
export type Result_1 = { 'ok' : Array<Transaction> } |
  { 'err' : Error };
export type Result_2 = { 'ok' : Array<Task> } |
  { 'err' : Error };
export type Result_3 = { 'ok' : Array<Goal> } |
  { 'err' : Error };
export type Result_4 = { 'ok' : Array<Child> } |
  { 'err' : Error };
export type Result_5 = { 'ok' : Child } |
  { 'err' : Error };
export interface RewardRequest {
  'id' : string,
  'reward' : bigint,
  'value' : bigint,
  'name' : string,
  'childId' : string,
}
export interface Task {
  'id' : bigint,
  'value' : bigint,
  'name' : string,
  'archived' : boolean,
}
export interface TaskCall { 'id' : bigint, 'value' : bigint, 'name' : string }
export interface TaskRequest {
  'id' : string,
  'value' : bigint,
  'name' : string,
  'childId' : string,
  'taskId' : bigint,
}
export interface Transaction {
  'id' : bigint,
  'completedDate' : string,
  'transactionType' : string,
  'value' : bigint,
  'name' : string,
}
export interface _SERVICE {
  'addChild' : ActorMethod<[ChildCall], Result_5>,
  'addGoal' : ActorMethod<[GoalCall, string], Result_3>,
  'addTask' : ActorMethod<[TaskCall, string], Result_2>,
  'approveTask' : ActorMethod<[string, bigint, string], Result>,
  'burnCode' : ActorMethod<[bigint], bigint>,
  'checkMagiCode' : ActorMethod<[bigint], [] | [string]>,
  'claimGoal' : ActorMethod<[string, bigint, string], Result>,
  'currentGoal' : ActorMethod<[string, bigint], Result>,
  'getBalance' : ActorMethod<[string], bigint>,
  'getChild' : ActorMethod<[string], string>,
  'getChildren' : ActorMethod<[], Result_4>,
  'getCurrentGoal' : ActorMethod<[string], bigint>,
  'getGoals' : ActorMethod<[string], Result_3>,
  'getRewardReqs' : ActorMethod<[string], Array<RewardRequest>>,
  'getTaskReqs' : ActorMethod<[string], Array<TaskRequest>>,
  'getTasks' : ActorMethod<[string], Result_2>,
  'getTransactions' : ActorMethod<[string], Result_1>,
  'hasRewards' : ActorMethod<[string], bigint>,
  'hasTasks' : ActorMethod<[string], bigint>,
  'magicCode' : ActorMethod<[string], [] | [bigint]>,
  'numberOfProfiles' : ActorMethod<[], bigint>,
  'removeRewardReq' : ActorMethod<[string, string], string>,
  'removeTaskReq' : ActorMethod<[string, string], string>,
  'requestClaimReward' : ActorMethod<[string, bigint, bigint, string], string>,
  'requestTaskComplete' : ActorMethod<[string, bigint, string, bigint], string>,
  'updateChild' : ActorMethod<[string, Child], Result>,
  'updateGoal' : ActorMethod<[string, bigint, Goal], Result>,
  'updateTask' : ActorMethod<[string, bigint, Task], Result>,
  'whoami' : ActorMethod<[], Principal>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
