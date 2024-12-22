"use strict";(self.webpackChunk=self.webpackChunk||[]).push([[3630],{3905:(e,t,r)=>{r.r(t),r.d(t,{MDXContext:()=>s,MDXProvider:()=>h,mdx:()=>g,useMDXComponents:()=>u,withMDXComponents:()=>c});var o=r(67294);function n(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function a(){return a=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var r=arguments[t];for(var o in r)Object.prototype.hasOwnProperty.call(r,o)&&(e[o]=r[o])}return e},a.apply(this,arguments)}function i(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);t&&(o=o.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,o)}return r}function p(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?i(Object(r),!0).forEach((function(t){n(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):i(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function l(e,t){if(null==e)return{};var r,o,n=function(e,t){if(null==e)return{};var r,o,n={},a=Object.keys(e);for(o=0;o<a.length;o++)r=a[o],t.indexOf(r)>=0||(n[r]=e[r]);return n}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(o=0;o<a.length;o++)r=a[o],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(n[r]=e[r])}return n}var s=o.createContext({}),c=function(e){return function(t){var r=u(t.components);return o.createElement(e,a({},t,{components:r}))}},u=function(e){var t=o.useContext(s),r=t;return e&&(r="function"==typeof e?e(t):p(p({},t),e)),r},h=function(e){var t=u(e.components);return o.createElement(s.Provider,{value:t},e.children)},d={inlineCode:"code",wrapper:function(e){var t=e.children;return o.createElement(o.Fragment,{},t)}},m=o.forwardRef((function(e,t){var r=e.components,n=e.mdxType,a=e.originalType,i=e.parentName,s=l(e,["components","mdxType","originalType","parentName"]),c=u(r),h=n,m=c["".concat(i,".").concat(h)]||c[h]||d[h]||a;return r?o.createElement(m,p(p({ref:t},s),{},{components:r})):o.createElement(m,p({ref:t},s))}));function g(e,t){var r=arguments,n=t&&t.mdxType;if("string"==typeof e||n){var a=r.length,i=new Array(a);i[0]=m;var p={};for(var l in t)hasOwnProperty.call(t,l)&&(p[l]=t[l]);p.originalType=e,p.mdxType="string"==typeof e?e:n,i[1]=p;for(var s=2;s<a;s++)i[s]=r[s];return o.createElement.apply(null,i)}return o.createElement.apply(null,r)}m.displayName="MDXCreateElement"},37405:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>c,contentTitle:()=>l,default:()=>d,frontMatter:()=>p,metadata:()=>s,toc:()=>u});var o=r(83117),n=r(80102),a=(r(67294),r(3905)),i=["components"],p={title:"Changes to Flipper's Open Source Repository",author:"Anton Kastritskiy",author_title:"Software Engineer",author_url:"https://github.com/antonk52",author_image_url:"https://github.com/antonk52.png",tags:["flipper","oss","github"],hide_table_of_contents:!1},l="Changes to Flipper's Open Source Repository",s={permalink:"/blog/2024/10/24/changes-to-oss-flipper",source:"@site/blog/2024-10-24-changes-to-oss-flipper.md",title:"Changes to Flipper's Open Source Repository",description:"Flipper has been an integral part of the mobile development process at Meta for years. We've been proud to share our internal tool with the open source community, and it has been amazing to see how it has grown and evolved over time.",date:"2024-10-24T00:00:00.000Z",formattedDate:"October 24, 2024",tags:[{label:"flipper",permalink:"/blog/tags/flipper"},{label:"oss",permalink:"/blog/tags/oss"},{label:"github",permalink:"/blog/tags/github"}],readingTime:1.47,hasTruncateMarker:!1,authors:[{name:"Anton Kastritskiy",title:"Software Engineer",url:"https://github.com/antonk52",imageURL:"https://github.com/antonk52.png"}],frontMatter:{title:"Changes to Flipper's Open Source Repository",author:"Anton Kastritskiy",author_title:"Software Engineer",author_url:"https://github.com/antonk52",author_image_url:"https://github.com/antonk52.png",tags:["flipper","oss","github"],hide_table_of_contents:!1},nextItem:{title:"Headless Flipper - what it means for plugin developers",permalink:"/blog/2022/05/20/preparing-for-headless-flipper"}},c={authorsImageUrls:[void 0]},u=[{value:"Archiving the Repository",id:"archiving-the-repository",level:2},{value:"Why?",id:"why",level:2}],h={toc:u};function d(e){var t=e.components,r=(0,n.Z)(e,i);return(0,a.mdx)("wrapper",(0,o.Z)({},h,r,{components:t,mdxType:"MDXLayout"}),(0,a.mdx)("p",null,"Flipper has been an integral part of the mobile development process at Meta for years. We've been proud to share our internal tool with the open source community, and it has been amazing to see how it has grown and evolved over time.\nHowever, we have some important changes to announce regarding Flipper's open source repository."),(0,a.mdx)("h2",{id:"archiving-the-repository"},"Archiving the Repository"),(0,a.mdx)("p",null,"The Flipper repository is going to stop receiving updates and bug fixes. Later this year, we plan to archive the repository. This means that the repository will remain available in an archived state, but it will no longer be possible to create new issues, pull requests, or make changes to the code. You will still be able to clone or fork the repository and build Flipper from source code."),(0,a.mdx)("p",null,"While Flipper's repository will be archived. The source code will remain available to view or to fork."),(0,a.mdx)("h2",{id:"why"},"Why?"),(0,a.mdx)("p",null,"When Flipper was initially created, it was intended to fill a gap in native developer tooling. It was first open sourced in 2018, over 7 years ago. The native tooling capabilities have improved since then, and more people have stopped reaching for Flipper when doing native development. React Native removed Flipper from its default boilerplate in ",(0,a.mdx)("a",{parentName:"p",href:"https://reactnative.dev/blog/2024/04/22/release-0.74#removal-of-flipper-react-native-plugin"},"v0.74")," and recently announced ",(0,a.mdx)("a",{parentName:"p",href:"https://reactnative.dev/docs/react-native-devtools"},"React Native DevTools"),". Nowadays, you can use alternative tools to reproduce Flipper's capabilities. We recommend checking out this ",(0,a.mdx)("a",{parentName:"p",href:"https://shift.infinite.red/why-you-dont-need-flipper-in-your-react-native-app-and-how-to-get-by-without-it-3af461955109"},"blog post"),"."),(0,a.mdx)("p",null,"As a result, support for Flipper has been deprioritized, and Flipper no longer has a dedicated team to support it. While we are sad to see this chapter come to an end, we are proud of what we have accomplished and grateful to the community for their support."),(0,a.mdx)("p",null,"We want to thank everyone who has supported and contributed to Flipper over the years!"),(0,a.mdx)("p",null,"The Flipper team"))}d.isMDXComponent=!0}}]);