export const idlFactory = ({ IDL }) => {
  const ChildCall = IDL.Record({ 'name' : IDL.Text });
  const Child = IDL.Record({
    'id' : IDL.Text,
    'name' : IDL.Text,
    'archived' : IDL.Bool,
  });
  const Error = IDL.Variant({
    'NotFound' : IDL.Null,
    'BalanceNotEnough' : IDL.Null,
    'NotAuthorized' : IDL.Null,
    'AlreadyExists' : IDL.Null,
  });
  const Result_5 = IDL.Variant({ 'ok' : Child, 'err' : Error });
  const GoalCall = IDL.Record({ 'value' : IDL.Nat, 'name' : IDL.Text });
  const Goal = IDL.Record({
    'id' : IDL.Nat,
    'value' : IDL.Nat,
    'name' : IDL.Text,
    'archived' : IDL.Bool,
  });
  const Result_3 = IDL.Variant({ 'ok' : IDL.Vec(Goal), 'err' : Error });
  const TaskCall = IDL.Record({
    'id' : IDL.Nat,
    'value' : IDL.Nat,
    'name' : IDL.Text,
  });
  const Task = IDL.Record({
    'id' : IDL.Nat,
    'value' : IDL.Nat,
    'name' : IDL.Text,
    'archived' : IDL.Bool,
  });
  const Result_2 = IDL.Variant({ 'ok' : IDL.Vec(Task), 'err' : Error });
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : Error });
  const Result_4 = IDL.Variant({ 'ok' : IDL.Vec(Child), 'err' : Error });
  const RewardRequest = IDL.Record({
    'id' : IDL.Text,
    'reward' : IDL.Nat,
    'value' : IDL.Nat,
    'name' : IDL.Text,
    'childId' : IDL.Text,
  });
  const TaskRequest = IDL.Record({
    'id' : IDL.Text,
    'value' : IDL.Nat,
    'name' : IDL.Text,
    'childId' : IDL.Text,
    'taskId' : IDL.Nat,
  });
  const Transaction = IDL.Record({
    'id' : IDL.Nat,
    'completedDate' : IDL.Text,
    'transactionType' : IDL.Text,
    'value' : IDL.Nat,
    'name' : IDL.Text,
  });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Vec(Transaction), 'err' : Error });
  return IDL.Service({
    'addChild' : IDL.Func([ChildCall], [Result_5], []),
    'addGoal' : IDL.Func([GoalCall, IDL.Text], [Result_3], []),
    'addTask' : IDL.Func([TaskCall, IDL.Text], [Result_2], []),
    'approveTask' : IDL.Func([IDL.Text, IDL.Nat, IDL.Text], [Result], []),
    'burnCode' : IDL.Func([IDL.Nat], [IDL.Nat], []),
    'checkMagiCode' : IDL.Func([IDL.Nat], [IDL.Opt(IDL.Text)], []),
    'claimGoal' : IDL.Func([IDL.Text, IDL.Nat, IDL.Text], [Result], []),
    'currentGoal' : IDL.Func([IDL.Text, IDL.Nat], [Result], []),
    'getBalance' : IDL.Func([IDL.Text], [IDL.Nat], []),
    'getChild' : IDL.Func([IDL.Text], [IDL.Text], []),
    'getChildren' : IDL.Func([], [Result_4], []),
    'getCurrentGoal' : IDL.Func([IDL.Text], [IDL.Nat], []),
    'getGoals' : IDL.Func([IDL.Text], [Result_3], []),
    'getRewardReqs' : IDL.Func([IDL.Text], [IDL.Vec(RewardRequest)], []),
    'getTaskReqs' : IDL.Func([IDL.Text], [IDL.Vec(TaskRequest)], []),
    'getTasks' : IDL.Func([IDL.Text], [Result_2], []),
    'getTransactions' : IDL.Func([IDL.Text], [Result_1], []),
    'hasRewards' : IDL.Func([IDL.Text], [IDL.Nat], []),
    'hasTasks' : IDL.Func([IDL.Text], [IDL.Nat], []),
    'magicCode' : IDL.Func([IDL.Text], [IDL.Opt(IDL.Nat)], []),
    'numberOfProfiles' : IDL.Func([], [IDL.Nat], ['query']),
    'removeRewardReq' : IDL.Func([IDL.Text, IDL.Text], [IDL.Text], []),
    'removeTaskReq' : IDL.Func([IDL.Text, IDL.Text], [IDL.Text], []),
    'requestClaimReward' : IDL.Func(
        [IDL.Text, IDL.Nat, IDL.Nat, IDL.Text],
        [IDL.Text],
        [],
      ),
    'requestTaskComplete' : IDL.Func(
        [IDL.Text, IDL.Nat, IDL.Text, IDL.Nat],
        [IDL.Text],
        [],
      ),
    'updateChild' : IDL.Func([IDL.Text, Child], [Result], []),
    'updateGoal' : IDL.Func([IDL.Text, IDL.Nat, Goal], [Result], []),
    'updateTask' : IDL.Func([IDL.Text, IDL.Nat, Task], [Result], []),
    'whoami' : IDL.Func([], [IDL.Principal], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
