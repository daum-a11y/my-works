# CSS 기본 규칙
> CSS 사용 기본 규칙을 설명한다.
> Class, Id 명명 규칙 및 주석 사용을 안내한다.

## CSS 적용 방법
### External Style Sheet
- 일반 섹션 및 서비스의 경우 별도의 CSS 파일을 생성하여 사용한다.
- CSS 파일을 로드시에는 **@import 방식은 사용하지 않는다**.
    - HTML 에서 각 필요한 CSS 파일을 직접 불러 명시적으로 사용한다.
- CSS파일 상단에 charset을 표기한다.
```css
@charset "utf-8";
```
- 간단한 콘텐츠의 경우 하나의 CSS 파일로 로드될 수 있도록 구성한다.
- 복잡한 섹션의 경우 공통부분(common.css)과 콘텐츠부분(해당서비스.css)로 구성한다.
```html
<link rel="stylesheet" href="/css/common.css"> <!-- reset, common요소 (CSS분리가 필요하지 않는경우에는 common.css만 구성가능하다.) -->
<link rel="stylesheet" href="/css/top.css"> <!-- 콘텐츠관련 -->
```

### Internal Style Sheet
- 프로모션 등 페이지별로 스타일이 관리되는 경우 `<head>` 태그안에 스타일을 작성한다.
- 서비스 및 프로젝트별로 프로모션일 경우라도 External 방법으로 파일을 로드하여 작업할 수 있다.
```html
<head>
  <style>
     <!-- 스타일 작성 -->
  </style>
</head>
```
- Internal 스타일 작성시 beautify ignore:start/end 적용
```html
<head>
  <style>
    /* beautify ignore:start */     
    <!-- 스타일 작성 -->
    /* beautify ignore:end */
  </style>
</head>
```
```css
/*적용전*/
body,
th,
td,
input,
select,
textarea,
button {
  font-size: 12px;
  line-height: 1.5;
  font-family: 'NotoSans', 'Apple SD Gothic Neo', sans-serif;
  color: #1A1A1A
}
/*...*/
/*이하생략*/
```
```css
/*적용후*/
body,th,td,input,select,textarea,button{font-size:12px;line-height:1.5;font-family:'NotoSans','Apple SD Gothic Neo',sans-serif;color:#1A1A1A} 
/*... */
/*이하생략*/
```
*beautify ignore 코드 추가 작성 유무에 따라 gitval에서 build 처리시 Internal 스타일시트의 개행처리가 달라지게 된다.

## CSS 작성 규칙
### 일반
- CSS 작성의 대전제는 용량을 줄이는 것에 그 첫 번째 목적을 둔다.
- 따라서,  불필요한 공백이나 속성은 사용하지 않는 것을 원칙으로 한다.
- CSS 선언 간에는 최소한의 가독성을 위해 개행한다.
- 아래 3가지 방식을 모두 허용한다.
```css
.gnb_comm { 
  overflow: hidden;
  width: 978px;
  clear: both;
}

.gnb_comm { overflow: hidden; width: 978px; clear: both; }

.gnb_comm { overflow: hidden; width: 978px; clear: both }  
```

### 따옴표 사용
- 속성 선언에 따옴표 생략이 필요한곳은 사용하지 않는다.
- 한글폰트 선언이나, 공백표현처럼 사용이 필요한 경우는 **홑따옴표(')**로 통일한다
```css
.list_news { 
  font-family: "돋움", "Malgun Gothic", Dotum, Arial, sans-serif; /* (x) 쌍따옴표는 사용하지않음 */
}
.list_news {
  font-family: '돋움', 'Malgun Gothic', Dotum, Arial, sans-serif; /* (o) */  
}

.list_news {
  background: url('/image/box_news.gif') no-repeat; /* (x) url표시는 생략가능 */
}
.list_news {
  background: url(/image/box_news.gif) no-repeat; /* (o) */
} 
```

## 주석 규칙
- 간단명료하게 해당 내용을 안내한다.
- CSS 주석 기호( /*, */ )와 주석의 내용 사이에는 반드시 공백 한 칸이 있어야 한다.
```css
/* 주석 표기 방법 */
/*common*/ (x)
/* common */ (o)
```
- 단락간 주요구분은 주석을 통해 관련 정보 전달한다.
- 추가 및 수정이 되어 주석을 기입하는 경우 해당 수정날짜로 시작하는데
  두 줄이상일 경우 범위로 표시하며, 한 줄일 경우 해당 선언 마지막 뒤에 공백없이 표시한다.
- 날짜 주석이 추가 되는경우
  범위 주석 : 최신 주석이 기존 범위를 감싸도록 추가
  한줄 주석 : 최신 주석이 뒤로가도록 추가
  위 방식대로 추가하는것을 지향하나 서비스 별로 다를 수 있으니 참고만 요한다.
```css  
/* 2018-11-30 GNB 수정 시작 */
.gnb_comm{overflow:hidden;width:978px;clear:both}
.gnb_comm li{float:left;height:38px}
.gnb_comm .menu{display:block;overflow:hidden;height:38px}
.gnb_comm .home{width:79px}
.gnb_comm .roadmap{width:98px}
.gnb_comm .on .menu{margin:0 -1px}
/* 2018-11-30 GNB 수정 끝 */

.list_news .on .wrap_menu{margin:0 -1px}/* 2018-11-30 수정 */
```

## Selector 명시
- 중복 선언, 퍼포먼스 이슈를 최소화하여 작업한다.
- ID, Class 명명 규칙은 서비스/프로젝트 별로 정의하여 사용한다.
    - 프로젝트 문서에 규칙을 정의하여 협업을 편리하게 한다.


### 타입 선택자(HTML Element)
- 중복선언되어 예기치 못한 부분에서 스타일이 변경되는 이슈를 주의해야한다.
- 따라서, Reset CSS 및 Global CSS 를 제외하고 단독으로 정의하지 않는다.
```css
button{font-size:14px;line-height:18px}       /* (x) */
.wrap_btn button{font-size:14px;line-height:18px}  /* (o) */
```

- div, span 과 같이 개발 작업시 빈번히 추가되는 태그는 선택자로 사용시 주의가 필요하다.

### ID 선택자
- ID는 Camel Case 방식 으로 단어와 단어 사이를 연결하여 사용한다.
  ```
  id="boardView" ( o )  
  id="link_view" ( x )
  ```
- id는 화면에서의 고유 기능을 명시하도록 naming한다.
  ```
  id="btnSearch" ( x ) /* 검색버튼은 한 페이지에 여러개 있을 수 있음 */  
  id="btnGnbSearch" ( o )
  ```

### Class 선택자
- 요소 기능을 표현하도록 명명한다
- 간결하게 명명한다.
- <u>서비스/프로젝트에서 정의한 별도의 가이드가 없을 경우 아래 규칙에 따른다.</u>

#### 명명 규칙
- 클래스명은  ' **형태_의미_상태** ' 순서로 조합한다. (Prefix_Subfix_Suffix)
  ```
  class="boardView" ( x )
  class="link_view" ( o )
  ```
- **class는 Underscore** 를 이용하여 연결 한다.
- **단독 클래스**
    - 단독 클래스 사용은 자제한다.
        - 이유1. 확장 프로그램등에 사용에서 중복될 수 있는 보편적인 클래스 사용을 피한다.
        - 이유2. 클래스 자체로 요소 기능을 이해할 수 있도록 명명한다.
    - 예외 사항 : 동작 구현에 필요한 클래스에만 사용한다.  
      ```
      on, show, hide, active, select, disabled
      ```

- 2단계 조합을 권장하며 3단계 조합을 넘어가지 않도록 한다.
  ```html
  형태(prefix)_의미(subfix)_상태(suffix)  
  box_news ( 권장 )  
  btn_apply_on ( o )  
  box_reply_open ( o )
  box_reply_open_off ( x )
  ```

- **스타일로 구분되는 클래스명 사용**
    - width와 height와 같은 사이즈 또는 여백, 컬러값에 대한 스타일값을 정의하는 클래스명의 사용을 지양한다.
     - 스타일로 구분하는 클래스명 사용 예제

|예제|비고|
|--|--|
|txt_red<br> txt_bold|직접적인 색상 or 굵기 정의|
|btn_width<br>btn_height|직접적인 스타일 속성이름 정의| 
|opt_w100<br>opt_h50<br>size_100x200|직접적인 사이즈 정의|
|margin_top10<br>margin_10<br>mt10<br>mb10|직접적인 여백값 정의|  


- 우선적으로는 기능을 명시하는 클래스를 정의하고, 프로젝트 특성에 따라서 사용할 수 있는 범위 내에서는 서비스의 규칙을 가지고 사용한다.
    - 어드민과 같은 폼요소 및 케이스가 많은 프로젝트
    - 가이드가 필요한 단위별 컴포넌트 작업건 등의 특이 케이스

- 축약형 사용 자제
    - **미리 정의되지 않은 축약형은 사용하지 않는다.**
        - ex) feature_head > fet_head , list_choice > list_chi  
          위와 같이 의미를 쉽게 알아볼 수 없는 축약형은 지양한다.

- Prefix, Subfix, Suffix 를 정의하여 사용한다.
- **아래 제공 방식은 참고 사항으로 서비스/프로젝트 별로 다르게 정의하여 사용 가능하다.**

##### Prefix
접두사를 의미하는 것으로, 앞부분에 사용하며, **형태를 나타내는 데 사용**된다.

|분류|Prefix|부가 설명|
|--|--|--|
|타이틀|tit|일반적인 타이틀|  
|영역|section|- 제목 태그(Heading Tag)를 지닌 영역 구분 (선택적 사용, 중첩사용 지양)<br>- unique한 클래스로 대체가능 ( 단, 2단어의 조합시 underscore 로 적용.)|
||wrap|일반 영역의 묶음 (선택적 사용, 중첩사용 지양)|
||inner|부모 wraper 가 존재하며 자식 묶음이 단독으로 필요한 경우|
||box||
|네비게이션|gnb|서비스 전체 네비게이션|
||lnb|지역 네비게이션(gnb 영역)|
||snb|사이드 네비게이션(좌측메뉴)|
|탭|tab|| 
|테이블|tbl||
|목록|list|일반 목록(ul, ol, 리스트 형식의 dl)|
|폼|tf|textfild (input 타입 text / textarea)|
||inp|input 타입 radio, checkbox, file 등|
||opt|selectbox|
||lab label||
||fld|fieldset|
|버튼|btn||
|아이콘|ico||
|배경|bg||  
|썸네일이미지|thumb||
|페이징|paging||
|배너|bnr/banner||
|텍스트|txt ||
|링크|link|일반 링크|
||link_more|더보기 링크|
|상태변화|on|활성화 (on 중첩구조시 내부에는 name_on으로 사용)|
||off|비활성화|
||over|오버|
||hit|클릭|
||focus|선택시|
|순서|fst, mid, lst| 가상선택자 미지원일 경우에만 사용|
|팝업|popup||
|레이어|layer||
|광고|ad||
|위젯|widget||
|상세내용|desc||
|댓글|cmt||

- 상황에 따라 표에 있는 프리픽스(형태)+프리픽스(의미)로 네이밍 조합을 할 수 있다.
- 많이 쓰이는 네이밍의 조합인 경우 글로벌한 성격이 강해지므로 공용 클래스로 선언하거나, 중복선언되지 않도록 유의한다.
    - 예시) wrap_tit, txt_info, link_tab 등
- txt_g, link_g, desc_g 등의 **_g**는 **global**의 축약이며, tit_comm, ico_comm 등의 **_comm**은 **common**의 축약이다.
    - 따라서 해당 네이밍은 전역(global) 또는 공용 클래스에 권장되며 남발되지 않도록 유의한다.

##### Subfix
하부 기호로서 subfix는 prefix와 함께 부가 설명 용도로 사용 한다.

|분류|subfix|부가 설명|
|--|--|--|
|공용|comm|전역으로만 사용|
|위치변화|top / mid / bot / left / right||
|순서변화|fst / lst||
|그림자|shadow||
|화살표|arr||
|버튼상태변화|nor||
|방향|hori / vert||
|카테고리|cate||
|순위|rank||

##### Suffix
접미사를 의미하는 것으로, prefix와 함께 부가 설명 용도로 사용 하며 주로 **현재 상태**를 나타내는 데 사용된다.

|분류|suffix|부가 설명|
|--|--|--|  
|상태변화|_on / _off / _over / _hit / _focus||
|위치변화|_top / _mid / _bot / _left / _right||
|순서변화|_fst / _lst||
|이전/다음|_prev / _next||

# CSS 작성 규칙 - Property, Value 등
> CSS 속성 사용 규칙을 안내합니다.

## Properties

### CSS Shorthand Properties
#### font
- font 스타일 선언시 축약형을 사용하는 경우에는 모든 항목의 값을 반드시 넣어준다.
- 속성값의 순서가 명확하므로 아래와 같은 순서로 명시한다. ```(font-weight > font-size/line-height > font-family > color)```
```css
.txt_g {
  font: bold normal 14px/1.5 '굴림', Gulim, sans-serif; /* (o) */
  font: bold 14px/1.5; /* (x) font-variant, font-family 누락되었음 */
}
```
- font 관련 스타일 중 일부만 변경 하고자 하는 경우 축약형을 사용하지 않으며 별도의 속성으로 분리해서 선언한다. *(축약형 사용시 누락된 속성은 기본값으로 설정되어 의도하지 않은 결과를 초래한다.)*
```css
.txt_g {
  font-family: '굴림', Gulim, sans-serif; /* (o) */
  font: '굴림', Gulim, sans-serif; /* (x) */
}
```

### 선언 순서
- CSS속성 선언 순서를 맞춰야하는 경우 아래와 같은 순서로 선언한다. *(아래 표에 제공하는 방식의 속성 순서 선언은 필수 항목은 아니다.)*

|순서|속성|의미|비고| 
|---|---|---|---|
|1|Display|표시||
|2|Flex||*display:flex 선언시 해당요소와 자식요소에 적용, 하단 flex 사용 방법 참고*|
|3|Overflow|넘침||
|4|Float & Clear|띄움 & 취소||
|5|Position|위치|*position 다음 순서로 top, left 등 위치 속성을 선언한다.*|
|6|Z-index|정렬||
|7|Width & Height|크기|*min-width, max-width 등도 이 순서에 포함된다.*|
|8|Margin & Padding|간격||
|9|Border|보더|*개별속성 선언 순서 : border-width > border-style > border-color > border-radius*|
|10|Font|폰트|*개별속성 선언 순서 : font-weight > font-size > line-height > font-family > font-style > color*|
|11|Background|배경|*개별속성 선언 순서 : background-image > background-repeat > background-color > background-position > background-size > background-attachment > background-origin > background-clip*| 
|12|Etc(기타)||| 

#### Flex 부모 요소 사용 방법
|순서|속성|의미|비고|
|---|---|---|---|
|1|flex-direction|진행방향||  
|2|flex-wrap|줄바꿈|*flex-flow로 축약 가능 "flex-flow:column wrap"*|
|3|justify-content|가로정렬|| 
|4|align-items|세로정렬||
|5|align-content|2줄이상 세로정렬||

#### Flex 자식 요소 사용 방법
|순서|속성|의미|비고|
|---|---|---|---|  
|1|flex-grow|여백 처리||
|2|flex-shrink|넘침 처리|*flex로 축약 가능 "flex:1" 또는 "flex:1 0 auto"*|
|3|flex-basis|넓비 기준||
|4|align-self|세로 정렬||
|5|order|순서||

## Value

### 링크영역 지정
- 인터렉티브 콘텐츠 중 사용자의 클릭 및 탭 동작을 요구하는 경우, 사용이 편리하도록 해당 영역이 확보되어야한다.
- ***최소***한의 링크영역은 아래와 같이 기준을 두어 작업한다. *(디자인요소외 영역이 확보 된다면 아래 수치보다 최대한 확보한다.)*
    - PC : 18px x 18px
    - Mobile : 32px x 32px
- 키보드로 초점 이동시 시각적으로 구별할 수 있도록 지정한다.
    - 디자인에 의한 outline:none의 사용을 지양하며, 접근성을 위하여 focus 속성 활용을 통하여 시각적인 표시를 도와준다.
    - 사용자 커스텀으로 지정할 경우 모든 상호 작용 요소(a, input, button 등)의 스타일을 고려하고 테스트 후 적용함으로써 페이지의 일관성을 유지하도록 한다.
```css  
:focus {
  outline: 2px solid #0071e3;
  outline-offset: -7px
}
```

### margin & padding
- 상하좌우 속성이 동일한 경우 축약하여 사용한다.
```css
.box_g {
  margin: 0 auto;
  padding: 10px;  /* (o) */
}

.box_g {
  margin: 0 auto 0;
  padding: 10px 10px;  /* (x) */
}
  
.box_g {
  margin: 10px 20px 15px;  /* (o) */
}
  
.box_g {
  margin: 10px 20px 15px 20px;  /* (x) */  
}
```

### Border
- border 스타일 선언시 축약형 순서는 아래와 같은 순서로 명시한다 ```(border-width > border-style > border-color)```
```css
.box_g {
  border: 1px solid #222;
  border-top: 1px solid #222;
}  
```
- border(또는 border-top, border-bottom 등) 축약 속성을 먼저 선언하며 부분 변경이 필요한 경우 개별 속성을 선언한다.
```css
.box_g {
  border: solid #222;
  border-width: 1px 0;
}
/* or */
.box_g {
  border: 1px solid #222;
}
.box_g1 {
  border-style: dotted;  
}
.box_g2 {  
  border-color: #000;
}
```
- 세부 속성이 2개 이상 다를 경우 아래와 같이 선언할 수 있다.
```css
.box_g {
  border: 1px solid;
  border-color: #000 #000 #222 #222; /* (o) */
}

.box_g { 
  border: 1px solid #000;
  border-bottom: 1px solid #222;
  border-left: 1px solid #222; /* (x) */
}
```

### font-size
- 다양한 환경의 플랫폼을 위해 px 단위를 사용한다.
- 프로젝트의 특성상 필요한 경우 rem, em, % 등 을 사용할 수 있다.

### font-family
- 한글, 공백을 포함한 폰트명은 홑따옴표(')로 감싸서 사용한다.
    - 공백을 표기해야하는 폰트명은 공백까지 정확히 넣어 사용한다.
```css
.tit_comm {
  font-family: 'Malgun Gothic','맑은 고딕', sans-serif;  /* (o) */
}

.tit_comm {
  font-family: 'Malgun Gothic,맑은 고딕,sans-serif';  /* (x) */
}
```
- 폰트 선언시 마지막에는 generic-font-families(serif, sans-serif, fantasy 등) 를 명시하여 지정 폰트가 없을경우 비슷한 형태로 제공한다.

### color
- 16진수(#RRGGBB, #RGB) 사용한다.
- 반복되는 값의 경우 축약형을 사용한다. ```(ex. color:#666666 => color:#666 , #ffaa00 => #fa0)```
- 16진수는 대소문자를 구분하지 않기 때문에 대소문자 구분없이 사용 가능하다. ```(ex. color:#fff (O), color:#FFF (O))```
```css
/* 비권장 : RGB값, 색이름 사용 */
.tit_comm {
  color: rgb(255,0,0);
  background: blue;  
}

/* 권장 : HEX값 사용 */ 
.tit_comm {
  color: #f00;
  background: #00f;
}
```
- Alpha 값 사용
    - rgba() 사용
        - ```ex) rgba(0,0,0,0.5) , rgba(0,0,0,.5)``` 두가지 표기방법 모두 가능
    - hex (#rrggbbaa) 사용
        - ```ex) #00000080``` 표기방법 가능( IE 버전 미적용 ) : https://caniuse.com/css-rrggbbaa
        - 변환법 : https://rgbacolorpicker.com/rgba-to-hex#google_vignette
    - Alpha 값 및 반투명 PNG 사용을 위한 filter 적용은 하지 않는다 (퍼포먼스 이슈 발생)

### z-index
- z-index 수치 간격은 10단위로 적용한다.
    - 서비스/프로젝트마다 통일된 단위를 사용하는것이 주된 목적이다.
    - 따라서, 서비스/프로젝트별로 단위를 다르게 적용할 수 있다.
- 페이지 단위(일반 콘텐츠)에서 1000 미만으로 사용한다.
- 전사공통인 서제스트인 경우는 9999로 유지한다.
- 레이어
    - 서제스트를 사용하는 경우 : 10000 이상 값을 사용한다
    - 서제스트를 사용하지 않는 경우 : 1000 ~ 9990 사이 값을 사용한다.

## ETC

### !important
- !important 필터는 렌더링이슈로 가급적 사용을 지양한다.

### display:inline-block
- display:inline-block 선언시 형제요소들간의 정렬을 맞추기 위해 vertical-align:top을 선언한다.
- 상황에 따라 다르기 때문에 필수는 아니다.
- inline 또는 inline-block으로 형제요소 배치시 엔터나 스페이스 등으로 태그간 공백이 있다면 요소간 간격이 발생하여 아래와 같은 보완이 필요하다.
    - 부모요소에 font-size:0을 선언한다. 해당 자식요소에 font-size를 선언하지 않는다면 font-size:0이 상속되므로 유의하도록 한다. (screen_out, ir_pm 등도 상속을 받아 0이 되므로 초점이 안잡히기 때문이다.)
    - display:flex가 사용가능한 환경이라면 부모요소에 display:flex를 선언하여 요소간의 간격을 없앨 수 있다.

### outline
- outline:none 또는 outline:0 선언은 웹접근성 미준수됨으로 사용을 지양한다.
