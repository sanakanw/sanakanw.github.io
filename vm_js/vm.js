const debug = 0;

const sizeof_op_t = 4;
const sizeof_int_t = 4;

function hash(key)
{
  let hash = 5381;
  for (let i = 0; i < key.length; i++)
    hash = ((hash << 5) + hash) + key.charCodeAt(i);
  
  return hash;
}

let enum_val;

enum_val = 0;
const ip = enum_val++;
const sp = enum_val++;
const bp = enum_val++;
const ax = enum_val++;

enum_val = 0;
const IMM       = enum_val++; 
const ADD       = enum_val++;
const SUB       = enum_val++;
const MUL       = enum_val++;
const DIV       = enum_val++;
const LDR       = enum_val++;
const LDR1      = enum_val++;
const STR       = enum_val++;
const STR1      = enum_val++;
const POP       = enum_val++;
const PUSH      = enum_val++;
const CMP       = enum_val++;
const SETZ      = enum_val++;
const SETG      = enum_val++;
const SETL      = enum_val++;
const SETGE     = enum_val++;
const SETLE     = enum_val++;
const SETNZ     = enum_val++;
const JZ        = enum_val++;
const JG        = enum_val++;
const JL        = enum_val++;
const JGE       = enum_val++;
const JLE       = enum_val++;
const JNZ       = enum_val++;
const JMP       = enum_val++;
const ENTER     = enum_val++;
const LEAVE     = enum_val++;
const CALL      = enum_val++;
const RET       = enum_val++;
const LEA       = enum_val++;
const LEA1      = enum_val++;
const SYS_CALL  = enum_val++;
const AND       = enum_val++;
const OR        = enum_val++;
const XOR       = enum_val++;
const SHR       = enum_val++;
const SHL       = enum_val++;
const NOT       = enum_val++;

enum_val = 0;
const sys_print = enum_val++;
const sys_exit  = enum_val++;

const MAX_STACK = 2048;
const MAX_MEMORY = 4096;

let reg_str = [
  "ip",
  "sp",
  "bp",
  "ax"
];

let instr_str = [
  "imm  ",
  "add  ",
  "sub  ",
  "mul  ",
  "div  ",
  "ldr  ",
  "ldr  ",
  "str  ",
  "str  ",
  "pop  ",
  "push ",
  "cmp  ",
  "setz ",
  "setg ",
  "setl ",
  "setge",
  "setle",
  "setnz",
  "jz   ",
  "jg   ",
  "jl   ",
  "jge  ",
  "jle  ",
  "jnz  ",
  "jmp  ",
  "enter",
  "leave",
  "call ",
  "ret  ",
  "lea  ",
  "lea  ",
  "sys  "
];

function vm_create()
{
  let reg = new Int32Array(ax + 1);
  let mem = new Int32Array(MAX_MEMORY);
  
  return {
    dict: [],
    reg: reg,
    mem: mem,
    tmp: 0,
    zf: 0,
    sf: 0,
    stack_pos: 0
  };
}

function fetch(vm)
{
  let value = vm.mem[vm.reg[ip] / sizeof_op_t];
  vm.reg[ip] += sizeof_op_t;
  return value;
}

function pop(vm)
{
  let value = vm.mem[vm.reg[sp] / sizeof_op_t];
  vm.reg[sp] += sizeof_op_t;
  return value;
}

function push(vm, value)
{
  vm.reg[sp] -= sizeof_op_t;
  vm.mem[vm.reg[sp] / sizeof_op_t] = value;
}

function exec(vm)
{
  switch (fetch(vm)) {
  case IMM:
    vm.reg[ax] = fetch(vm);
    break;
  case ADD:
    vm.reg[ax] = pop(vm) + vm.reg[ax];
    break;
  case SUB:
    vm.reg[ax] = pop(vm) - vm.reg[ax];
    break;
  case MUL:
    vm.reg[ax] = pop(vm) * vm.reg[ax];
    break;
  case DIV:
    vm.reg[ax] = pop(vm) / vm.reg[ax];
    break;
  case AND:
    vm.reg[ax] = pop(vm) & vm.reg[ax];
    break;
  case OR:
    vm.reg[ax] = pop(vm) | vm.reg[ax];
    break;
  case XOR:
    vm.reg[ax] = pop(vm) ^ vm.reg[ax];
    break;
  case SHR:
    vm.reg[ax] = pop(vm) >> vm.reg[ax];
    break;
  case SHL:
    vm.reg[ax] = pop(vm) << vm.reg[ax];
    break;
  case LDR:
    vm.reg[ax] = vm.mem[(vm.reg[fetch(vm)] + vm.reg[ax]) / sizeof_int_t];
    break;
  case LDR1:
    vm.reg[ax] = vm.mem[vm.reg[ax] / sizeof_int_t];
    break;
  case STR:
    vm.mem[(vm.reg[fetch(vm)] + pop(vm)) / sizeof_int_t] = vm.reg[ax];
    break;
  case STR1:
    vm.mem[pop(vm) / sizeof_int_t] = vm.reg[ax];
    break;
  case POP:
    vm.reg[ax] = pop(vm);
    break;
  case PUSH:
    push(vm, vm.reg[ax]);
    break;
  case CMP:
    vm.tmp = pop(vm) - vm.reg[ax];
    vm.zf = vm.tmp == 0;
    vm.sf = vm.tmp < 0;
    break;
  case JMP:
    vm.reg[ip] += fetch(vm);
    break;
  case JZ:
    if (vm.zf) vm.reg[ip] += fetch(vm);
    else fetch(vm);
    break;
  case JG:
    if (!vm.sf) vm.reg[ip] += fetch(vm);
    else fetch(vm);
    break;
  case JL:
    if (vm.sf) vm.reg[ip] += fetch(vm);
    else fetch(vm);
    break;
  case JNZ:
    if (!vm.zf) vm.reg[ip] += fetch(vm);
    else fetch(vm);
    break;
  case JLE:
    if (vm.sf | vm.zf) vm.reg[ip] += fetch(vm);
    else fetch(vm);
    break;
  case JGE:
    if (!vm.sf | vm.zf) vm.reg[ip] += fetch(vm);
    else fetch(vm);
    break;
  case ENTER:
    push(vm, vm.reg[bp]);
    vm.reg[bp] = vm.reg[sp];
    vm.reg[sp] -= fetch(vm);
    break;
  case LEAVE:
    vm.reg[sp] = vm.reg[bp];
    vm.reg[bp] = pop(vm);
    break;
  case RET:
    vm.reg[ip] = pop(vm);
    break;
  case CALL:
    push(vm, vm.reg[ip] + sizeof_op_t);
    vm.reg[ip] += fetch(vm);
    break;
  case LEA:
    vm.reg[ax] = vm.reg[fetch(vm)] + vm.reg[ax];
    break;
  case LEA1:
    vm.reg[ax] = vm.reg[ax];
    break;
  case SYS_CALL:
    switch (fetch(vm)) {
    case sys_print:
      console.log("out: " + vm.reg[ax]);
      break;
    }
    break;
  case SETZ:
    vm.reg[ax] = vm.zf;
    break;
  case SETG:
    vm.reg[ax] = !vm.sf;
    break;
  case SETL:
    vm.reg[ax] = vm.sf;
    break;
  case SETGE:
    vm.reg[ax] = vm.zf | !vm.sf;
    break;
  case SETLE:
    vm.reg[ax] = vm.zf | vm.sf;
    break;
  case SETNZ:
    vm.reg[ax] = !vm.zf;
    break;
  case NOT:
    vm.reg[ax] = ~vm.reg[ax];
    break;
  default:
    alert("error: unknown op\n");
    break;
  }
}

function print_stack(vm)
{
  let str_stack = "";
  for (let i = 0; i < 8; i++) {
    let stack_pos = vm.stack_pos / sizeof_op_t + MAX_STACK - i - 1;
    
    str_stack += String("000" + (i * 4).toString()).slice(-3) + " ";
    str_stack += String("00000000" + vm.mem[stack_pos].toString(16)).slice(-8);
    
    if (vm.reg[sp] == stack_pos * sizeof_op_t)
      str_stack += "*";
    
    str_stack += "\n";
  }
  
  console.log(str_stack);
}

function dump(buffer, pos)
{
  while (pos < buffer.length) {
    switch (buffer[pos]) {
    case JZ:
    case JG:
    case JL:
    case JGE:
    case JLE:
    case JNZ:
    case IMM:
    case JMP:
    case ENTER:
    case CALL:
    case LDR:
    case STR:
    case LEA:
    case SYS_CALL:
      console.log(instr_str[buffer[pos++]] + " " + buffer[pos++].toString());
      break;
    default:
      console.log(instr_str[buffer[pos++]]);
      break;
    }
  }
}

function vm_load_bin(vm, bin)
{
  let pos = 0;
  let text_size = bin[pos++];
  let num_label = bin[pos++];
  
  let dict = [];
  for (let i = 0; i < num_label; i++) {
		dict.push({
      id: bin[pos++],
      offset: bin[pos++]
    });
  }
  
  for (let i = 0; i < text_size / sizeof_op_t; i++) {
    if (i > MAX_MEMORY - MAX_STACK)
      console.log("error: overflow in vm_load_bin()");
    
    vm.mem[i] = bin[pos++];
  }
  
  vm.dict = dict;
  vm.stack_pos = text_size;
  vm.reg[ax] = 0;
  vm.reg[sp] = vm.stack_pos + MAX_STACK * sizeof_op_t;
  vm.reg[bp] = vm.stack_pos + MAX_STACK * sizeof_op_t;
}

function vm_find_label(vm, key)
{
  let id = hash(key);
  for (let i = 0; i < vm.dict.length; i++) {
    if (vm.dict[i].id == id) {
      return vm.dict[i].offset;
    }
  }
  
  console.log("error: cannot find label", key, id);
  
  return null;
}

function vm_call(vm, module, args)
{
  let entry_point = vm_find_label(vm, module);
  
  push(vm, -1);
  vm.reg[ip] = entry_point;
  
  if (args) {
    for (let i = 0; i < args.length; i++)
      vm.mem[vm.reg[sp] / sizeof_op_t - 2 - i] = args[i];
  }
  
  while (vm.reg[ip] != -1) {
    if (debug)
      console.log(instr_str[vm.mem[vm.reg[ip] / sizeof_op_t]]);
    
    exec(vm);
    
    if (vm.reg[sp] > vm.stack_pos + MAX_STACK * sizeof_op_t)
      console.log("error: stack overflow");
    
    if (debug) {
      print_stack(vm);
      
      console.log(
         "ax: " + vm.reg[ax] +
        " sp: " + vm.reg[sp] +
        " ip: " + vm.reg[ip] +
        " bp: " + vm.reg[bp] +
        " zf: " + vm.zf +
        " sf: " + vm.sf);
      alert("HI");
    }
  }
}
