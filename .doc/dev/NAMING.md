# 네이밍 컨벤션 가이드

이 문서는 컴포넌트 개발 시 적용되는 네이밍 컨벤션을 정의합니다. 일관된 네이밍 패턴을 사용하면 코드의 가독성을 높이고 유지보수를 용이하게 만듭니다.

## 목차

1. [파일 및 폴더 네이밍](#파일-및-폴더-네이밍)
2. [컴포넌트 네이밍](#컴포넌트-네이밍)
3. [변수 및 상수 네이밍](#변수-및-상수-네이밍)
4. [함수 및 메서드 네이밍](#함수-및-메서드-네이밍)
5. [이벤트 핸들러 네이밍](#이벤트-핸들러-네이밍)
6. [Props 및 속성 네이밍](#props-및-속성-네이밍)
7. [타입 및 인터페이스 네이밍](#타입-및-인터페이스-네이밍)
8. [CSS 클래스 네이밍](#css-클래스-네이밍)
9. [테스트 파일 네이밍](#테스트-파일-네이밍)

## 파일 및 폴더 네이밍

### 폴더 네이밍

- 컴포넌트 폴더: **PascalCase** 사용
  ```
  Button/
  DatePicker/
  UserProfile/
  ```

- 유틸리티 및 기능 폴더: **camelCase** 사용
  ```
  utils/
  hooks/
  composables/
  ```

### 파일 네이밍

- 컴포넌트 파일: **PascalCase** 사용
  ```
  Button.tsx
  Button.vue
  Button.types.ts
  Button.test.ts
  Button.stories.ts
  ```

- 상수 파일: **카테고리.constants.ts** 형식 사용
  ```
  Button.constants.ts
  theme.constants.ts
  api.constants.ts
  ```

- 유틸리티/헬퍼 파일: **camelCase** 사용
  ```
  formatDate.ts
  stringUtils.ts
  ```

- 훅스 및 컴포저블 파일: **use + PascalCase** 형식 사용
  ```
  useWindowSize.ts
  useForm.ts
  useClickOutside.ts
  ```

- 인덱스 파일: 항상 **index.ts** 사용 (대소문자 변경 없음)
  ```
  index.ts
  ```

## 컴포넌트 네이밍

### 일반 규칙

- 컴포넌트 이름은 **PascalCase** 사용
- 의미 있고 설명적인 이름 사용 (너무 짧거나 모호한 이름 피하기)
- 목적이나 기능을 명확하게 표현하는 이름 사용

### React 컴포넌트

```tsx
// 좋은 예:
const Button = () => { ... };
const UserProfile = () => { ... };
const ProductCard = () => { ... };

// 나쁜 예:
const Btn = () => { ... };      // 너무 짧음
const UserPro = () => { ... };  // 불명확한 약어
const Component = () => { ... }; // 너무 일반적임
```

### Vue 컴포넌트

```vue
<script setup lang="ts">
// 컴포넌트 정의는 파일 이름에 의해 결정됨
// Button.vue, UserProfile.vue 등
</script>
```

### 컴포넌트 계층 구조가 있는 경우

- 관련 컴포넌트는 부모 이름을 접두사로 사용
  ```
  Table.tsx
  TableRow.tsx
  TableCell.tsx

  Form.vue
  FormInput.vue
  FormSelect.vue
  ```

## 변수 및 상수 네이밍

### 변수

- 일반 변수: **camelCase** 사용
  ```typescript
  const userName = 'John';
  let itemCount = 42;
  ```

- 불리언 변수: **is, has, can, should** 등의 접두사 사용
  ```typescript
  const isLoading = true;
  const hasError = false;
  const canEdit = true;
  const shouldRefresh = false;
  ```

- 참조형 변수(ref): Vue의 경우 일반 변수와 동일하게 **camelCase** 사용
  ```typescript
  const count = ref(0);
  const userName = ref('');
  ```

### 상수

- 지역 상수: **camelCase** 사용
  ```typescript
  const defaultPageSize = 10;
  const apiEndpoint = '/api/users';
  ```

- 전역/모듈 상수: **UPPER_SNAKE_CASE** 사용
  ```typescript
  // constants.ts
  export const API_BASE_URL = 'https://api.example.com';
  export const MAX_FILE_SIZE = 5242880;
  ```

- 열거형(enum) 또는 상수 객체:
    - 열거형/객체 이름: **PascalCase**
    - 열거형/객체 속성: **UPPER_SNAKE_CASE**
  ```typescript
  enum ButtonSize {
    SMALL = 'small',
    MEDIUM = 'medium',
    LARGE = 'large',
  }

  const HttpStatus = {
    OK: 200,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
  } as const;
  ```

## 함수 및 메서드 네이밍

### 일반 함수

- 모든 함수는 **camelCase** 사용
- 동사 또는 동사구로 시작 (함수의 목적을 설명)
  ```typescript
  function calculateTotal() { ... }
  function fetchUserData() { ... }
  function validateForm() { ... }
  ```

### 컴포저블 및 커스텀 훅

- **use** 접두사 + PascalCase 형식 사용
  ```typescript
  // Vue 컴포저블
  function useCounter() { ... }

  // React 커스텀 훅
  function useWindowSize() { ... }
  ```

### 순수 함수

- 결과를 반환하는 함수는 그 결과물이 무엇인지 설명하는 이름 사용
  ```typescript
  function getFullName(firstName, lastName) { ... }
  function formatCurrency(amount) { ... }
  ```

### 변환 함수

- **to** 또는 **from** 사용하여 변환 의도 표현
  ```typescript
  function toSnakeCase(text) { ... }
  function fromUnixTime(timestamp) { ... }
  ```

## 이벤트 핸들러 네이밍

### React

- **handle + 이벤트명** 형식 사용 (컴포넌트 내부 핸들러)
  ```typescript
  function handleClick() { ... }
  function handleChange() { ... }
  function handleSubmit() { ... }
  ```

- **on + 이벤트명** 형식 사용 (외부로 전달되는 props)
  ```typescript
  <Button onClick={handleClick} />
  <Input onChange={handleChange} />
  ```

### Vue

- **handle + 이벤트명** 또는 **on + 이벤트명** 형식 사용 (컴포넌트 내부 핸들러)
  ```typescript
  function handleClick() { ... }
  function onChange() { ... }
  ```

- 이벤트 emit 네이밍: **kebab-case** 사용
  ```typescript
  emit('click');
  emit('update:model-value');
  emit('form-submit');
  ```

## Props 및 속성 네이밍

### 공통 규칙

- Props: **camelCase** 사용
- 불리언 props: **is, has, can, should** 등의 접두사 사용

### HTML 표준 속성 예외 사항

- HTML 표준 속성과 일치하는 props는 원래 HTML 속성명을 유지
  ```typescript
  // 좋은 예: HTML 표준 속성과 일치
  disabled?: boolean;
  readonly?: boolean;
  checked?: boolean;
  required?: boolean;

  // 좋은 예: HTML 표준에 없는 불리언 props는 접두사 사용
  isLoading?: boolean;
  hasError?: boolean;
  isSelected?: boolean;
  ```

- 이 예외는 개발자 직관성과 HTML 표준과의 일관성을 위해 적용됨

### React Props

```tsx
export interface ButtonProps {
  variant: 'primary' | 'secondary';
  size: 'small' | 'medium' | 'large';
  disabled?: boolean; // HTML 표준 속성 유지
  isLoading?: boolean; // 표준에 없는 속성은 접두사 사용
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  variant,
  size,
  disabled,
  isLoading,
  onClick,
}) => { ... };
```

### Vue Props

```typescript
// Props 정의
export interface Props {
  variant: 'primary' | 'secondary';
  size: 'small' | 'medium' | 'large';
  disabled?: boolean; // HTML 표준 속성 유지
  isLoading?: boolean; // 표준에 없는 속성은 접두사 사용
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  isLoading: false,
});
```

## 타입 및 인터페이스 네이밍

### 타입과 인터페이스 네이밍 규칙

- 타입/인터페이스 이름: **PascalCase** 사용
- 설명적인 명사(구) 사용
- 접미사 사용하여 의미 명확히 하기:
    - 인터페이스가 컴포넌트 Props를 위한 경우: **ComponentNameProps**
    - 타입이 상태를 위한 경우: **ComponentNameState**
    - 타입이 반환 값을 위한 경우: **ComponentNameResult**

```typescript
// 컴포넌트 Props 인터페이스
export interface ButtonProps {
  variant: string;
  size: string;
}

// 상태 타입
type FormState = {
  isValid: boolean;
  isSubmitting: boolean;
  errors: string[];
};

// API 응답 타입
export interface UserResponse {
  id: number;
  name: string;
  email: string;
}
```

### 타입 파일 분리 가이드라인

타입 정의는 다음 기준에 따라 별도 파일 분리 여부를 결정합니다:

1. **단일 파일에 포함하는 경우**:
    - 단일 인터페이스만 사용하는 간단한 컴포넌트
    - 해당 컴포넌트에서만 사용되는 타입으로, 5줄 이하의 간단한 타입 정의
    - 외부 재사용 필요성이 없는 타입

   ```typescript
   // Button.tsx 내부에 직접 정의
   export interface ButtonProps {
     variant: 'primary' | 'secondary';
     size: 'small' | 'medium' | 'large';
     disabled?: boolean;
     onClick?: () => void;
   }
   ```

2. **별도 파일로 분리하는 경우**:
    - 여러 타입 정의가 필요한 복잡한 컴포넌트
    - 여러 컴포넌트에서 공유되는 타입
    - enum, union 타입, 복합 타입 등 복잡한 타입 구조
    - 6줄 이상의 복잡한 타입 정의
    - 향후 확장 가능성이 높은 타입

   ```typescript
   // Button.types.ts
   export type ButtonSize = 'small' | 'medium' | 'large';
   export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';
   export type ButtonType = 'button' | 'submit' | 'reset';

   export interface ButtonProps {
     size?: ButtonSize;
     variant?: ButtonVariant;
     type?: ButtonType;
     disabled?: boolean;
     isLoading?: boolean;
     onClick?: () => void;
     children: React.ReactNode;
   }
   ```

3. **중요한 원칙**:
    - 일관성을 위해 비슷한 복잡도의 컴포넌트들은 동일한 패턴 적용
    - 팀 내 합의된 규칙에 따라 예외 적용 가능
    - 타입 파일 분리 여부와 관계없이 타입명 네이밍 규칙 준수

### 열거형(Enum)

- 열거형 이름: **PascalCase** 사용
- 열거형 값: **UPPER_SNAKE_CASE** 사용

```typescript
enum ButtonVariant {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  TERTIARY = 'tertiary',
}
```

## CSS 클래스 네이밍

- [마크업 가이드](./MARKUP_GUIDE.md)

## 테스트 파일 네이밍

- 테스트 파일: **ComponentName.test.ts** 또는 **ComponentName.spec.ts** 형식 사용
- 테스트 케이스: 명확하고 설명적인 문장 사용

```typescript
describe('Button', () => {
  it('renders correctly with default props', () => { ... });
  it('displays loading spinner when isLoading is true', () => { ... });
  it('calls onClick handler when clicked', () => { ... });
});
```

## 바람직한 네이밍 예시

### 컴포넌트 구조 예시

#### 복잡한 컴포넌트 (분리된 타입 파일)
```
Button/
├── Button.tsx               # React 컴포넌트
├── Button.vue               # Vue 컴포넌트
├── Button.types.ts          # 타입 정의
├── Button.constants.ts      # 상수 정의
├── Button.test.ts           # 테스트
├── Button.stories.ts        # 스토리북
└── index.ts                 # 내보내기
```

#### 간단한 컴포넌트 (타입이 컴포넌트 파일에 포함)
```
Icon/
├── Icon.tsx                 # React 컴포넌트 (타입 포함)
├── Icon.stories.ts          # 스토리북
└── index.ts                 # 내보내기
```

### 코드 예시

```typescript
// 복잡한 컴포넌트: Button.types.ts
export type ButtonSize = 'small' | 'medium' | 'large';
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

export interface ButtonProps {
  size?: ButtonSize;
  variant?: ButtonVariant;
  disabled?: boolean; // HTML 표준 속성 유지
  isLoading?: boolean; // 표준에 없는 속성은 접두사 사용
  onClick?: () => void;
}

// 간단한 컴포넌트: Icon.tsx
export interface IconProps {
  name: string;
  size?: 'small' | 'medium' | 'large';
}

const Icon: React.FC<IconProps> = ({ name, size = 'medium' }) => {
  return <span className={`ico_comm ico_${name} ico_${size}`} />;
};
```

## 주의사항

1. **일관성 유지**: 프로젝트 전체에서 동일한 네이밍 규칙을 유지하세요.
2. **의미 있는 이름**: 이름만으로도 의도와 목적을 이해할 수 있어야 합니다.
3. **약어 사용 제한**: 명확하지 않은 약어는 피하고, 필요한 경우 주석으로 설명하세요.
4. **문맥 고려**: 이름은 사용되는 맥락에서 의미가 명확해야 합니다.
5. **불필요한 반복 피하기**: `UserCard.getUserName()`보다는 `UserCard.getName()`이 간결합니다.
6. **실용성 고려**: 규칙이 목적이 아니라 가독성과 유지보수성이 목적임을 기억하세요.

---

특수한 경우에는 팀과 상의하여 예외를 적용할 수 있습니다.
