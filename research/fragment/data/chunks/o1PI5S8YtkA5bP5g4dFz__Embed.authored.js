import{jsx as _jsx}from"react/jsx-runtime";import{useEffect,useRef,useState}from"react";import{addPropertyControls,ControlType}from"framer";import{useIsOnCanvas,emptyStateStyle,containerStyles}from"https://framer.com/m/framer/default-utils.js";/**
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 *
 * @framerDisableUnlink
 */export default function Embed({type,url,html,zoom,radius,border,style={}}){if(type==="url"&&url){return /*#__PURE__*/_jsx(EmbedUrl,{url:url,zoom:zoom,radius:radius,border:border,style:style});}if(type==="html"&&html){return /*#__PURE__*/_jsx(EmbedHtml,{html:html,style:style});}return /*#__PURE__*/_jsx(Instructions,{style:style});}addPropertyControls(Embed,{type:{type:ControlType.Enum,defaultValue:"url",displaySegmentedControl:true,options:["url","html"],optionTitles:["URL","HTML"]},url:{title:"URL",type:ControlType.String,description:"Some websites don’t support embedding.",hidden(props){return props.type!=="url";}},html:{title:"HTML",type:ControlType.String,displayTextArea:true,hidden(props){return props.type!=="html";}},border:{title:"Border",type:ControlType.Border,optional:true,hidden(props){return props.type!=="url";}},radius:{type:ControlType.BorderRadius,title:"Radius",hidden(props){return props.type!=="url";}},zoom:{title:"Zoom",defaultValue:1,type:ControlType.Number,hidden(props){return props.type!=="url";},min:.1,max:1,step:.1,displayStepper:true}});function Instructions({style}){return /*#__PURE__*/_jsx("div",{style:{minHeight:getMinHeight(style),...emptyStateStyle,overflow:"hidden",...style},children:/*#__PURE__*/_jsx("div",{style:centerTextStyle,children:"To embed a website or widget, add it to the properties\xa0panel."})});}function EmbedUrl({url,zoom,radius,border,style}){const hasAutoHeight=!style.height;// Add https:// if the URL does not have a protocol.
if(!/[a-z]+:\/\//.test(url)){url="https://"+url;}const onCanvas=useIsOnCanvas();// We need to check if the url is blocked inside an iframe by the X-Frame-Options
// or Content-Security-Policy headers on the backend.
const[state,setState]=useState(onCanvas?undefined:false);useEffect(()=>{// We only want to check on the canvas.
// On the website we want to avoid the additional delay.
if(!onCanvas)return;// TODO: We could also use AbortController here.
let isLastEffect=true;setState(undefined);async function load(){const response=await fetch("https://api.framer.com/functions/check-iframe-url?url="+encodeURIComponent(url));if(response.status==200){const{isBlocked}=await response.json();if(isLastEffect){setState(isBlocked);}}else{const message=await response.text();console.error(message);const error=new Error("This site can’t be reached.");setState(error);}}load().catch(error=>{console.error(error);setState(error);});return()=>{isLastEffect=false;};},[url]);if(onCanvas&&hasAutoHeight){return /*#__PURE__*/_jsx(ErrorMessage,{message:"URL embeds do not support auto height.",style:style});}if(!url.startsWith("https://")){return /*#__PURE__*/_jsx(ErrorMessage,{message:"Unsupported protocol.",style:style});}if(state===undefined){return /*#__PURE__*/_jsx(LoadingIndicator,{});}if(state instanceof Error){return /*#__PURE__*/_jsx(ErrorMessage,{message:state.message,style:style});}if(state===true){const message=`Can’t embed ${url} due to its content security policy.`;return /*#__PURE__*/_jsx(ErrorMessage,{message:message,style:style});}return /*#__PURE__*/_jsx("iframe",{src:url,style:{...iframeStyle,...style,...border,zoom:zoom,borderRadius:radius,transformOrigin:"top center"},loading:"lazy",// @ts-ignore
fetchPriority:onCanvas?"low":"auto",referrerPolicy:"no-referrer",sandbox:getSandbox(onCanvas),allowFullScreen:true,allow:"presentation; fullscreen; accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; clipboard-write"});}const iframeStyle={width:"100%",height:"100%",border:"none"};function getSandbox(onCanvas){const result=["allow-same-origin","allow-scripts"];if(!onCanvas){result.push("allow-downloads","allow-forms","allow-modals","allow-orientation-lock","allow-pointer-lock","allow-popups","allow-popups-to-escape-sandbox","allow-presentation","allow-storage-access-by-user-activation","allow-top-navigation-by-user-activation");}return result.join(" ");}function EmbedHtml({html,...props}){const hasScript=html.includes("</script>");if(hasScript){const hasSplineViewer=html.includes("</spline-viewer>");const hasComment=html.includes("<!-- framer-direct-embed -->");if(hasSplineViewer||hasComment){return /*#__PURE__*/_jsx(EmbedHtmlWithScripts,{html:html,...props});}return /*#__PURE__*/_jsx(EmbedHtmlInsideIframe,{html:html,...props});}return /*#__PURE__*/_jsx(EmbedHtmlWithoutScripts,{html:html,...props});}function EmbedHtmlInsideIframe({html,style}){const ref=useRef();const[iframeHeight,setIframeHeight]=useState(0);// Handle auto sizing
useEffect(()=>{const iframeWindow=ref.current?.contentWindow;function handleMessage(event){if(event.source!==iframeWindow)return;const data=event.data;if(typeof data!=="object"||data===null)return;const height=data.embedHeight;if(typeof height!=="number")return;setIframeHeight(height);}window.addEventListener("message",handleMessage);// After SSG the iframe loads before we attach the event handler,
// therefore we need to request the latest height from the iframe.
iframeWindow?.postMessage("getEmbedHeight","*");return()=>{window.removeEventListener("message",handleMessage);};},[]);// The CSS is mainly copied from:
// FramerStudio/src/app/vekter/src/renderer/setDefaultFont.ts
// FramerStudio/src/app/vekter/src/export/globalStylesForExport.ts
const srcDoc=`
<html>
    <head>
        <style>
            html, body {
                margin: 0;
                padding: 0;
            }

            body {
                display: flex;
                justify-content: center;
                align-items: center;
            }

            :root {
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }

            * {
                box-sizing: border-box;
                -webkit-font-smoothing: inherit;
            }

            h1, h2, h3, h4, h5, h6, p, figure {
                margin: 0;
            }

            body, input, textarea, select, button {
                font-size: 12px;
                font-family: sans-serif;
            }
        </style>
    </head>
    <body>
        ${html}
        <script type="module">
            let height = 0

            function sendEmbedHeight() {
                window.parent.postMessage({
                    embedHeight: height
                }, "*")
            }

            const observer = new ResizeObserver((entries) => {
                if (entries.length !== 1) return
                const entry = entries[0]
                if (entry.target !== document.body) return

                height = entry.contentRect.height
                sendEmbedHeight()
            })

            observer.observe(document.body)

            window.addEventListener("message", (event) => {
                if (event.source !== window.parent) return
                if (event.data !== "getEmbedHeight") return
                sendEmbedHeight()
            })
        </script>
    <body>
</html>
`;const currentStyle={...iframeStyle,...style};const hasAutoHeight=!style.height;if(hasAutoHeight){currentStyle.height=iframeHeight+"px";}return /*#__PURE__*/_jsx("iframe",{ref:ref,style:currentStyle,srcDoc:srcDoc});}function EmbedHtmlWithScripts({html,style}){const ref=useRef();useEffect(()=>{const div=ref.current;if(!div)return;div.innerHTML=html;executeScripts(div);return()=>{div.innerHTML="";};},[html]);return /*#__PURE__*/_jsx("div",{ref:ref,style:{...htmlStyle,...style}});}function EmbedHtmlWithoutScripts({html,style}){return /*#__PURE__*/_jsx("div",{style:{...htmlStyle,...style},dangerouslySetInnerHTML:{__html:html}});}const htmlStyle={width:"100%",height:"100%",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center"};// This function replaces scripts with executable ones.
// https://stackoverflow.com/questions/1197575/can-scripts-be-inserted-with-innerhtml
function executeScripts(node){if(node instanceof Element&&node.tagName==="SCRIPT"){const script=document.createElement("script");script.text=node.innerHTML;for(const{name,value}of node.attributes){script.setAttribute(name,value);}node.parentElement.replaceChild(script,node);}else{for(const child of node.childNodes){executeScripts(child);}}}// Generic components
function LoadingIndicator(){return /*#__PURE__*/_jsx("div",{className:"framerInternalUI-componentPlaceholder",style:{...containerStyles,overflow:"hidden"},children:/*#__PURE__*/_jsx("div",{style:centerTextStyle,children:"Loading…"})});}function ErrorMessage({message,style}){return /*#__PURE__*/_jsx("div",{className:"framerInternalUI-errorPlaceholder",style:{minHeight:getMinHeight(style),...containerStyles,overflow:"hidden",...style},children:/*#__PURE__*/_jsx("div",{style:centerTextStyle,children:message})});}const centerTextStyle={textAlign:"center",minWidth:140};// Returns a min-height if the component is using auto-height.
function getMinHeight(style){const hasAutoHeight=!style.height;if(hasAutoHeight)return 200;}
export const __FramerMetadata__ = {"exports":{"default":{"type":"reactComponent","name":"Embed","slots":[],"annotations":{"framerSupportedLayoutHeight":"any-prefer-fixed","framerIntrinsicWidth":"600","framerDisableUnlink":"","framerContractVersion":"1","framerSupportedLayoutWidth":"fixed","framerIntrinsicHeight":"400"}},"__FramerMetadata__":{"type":"variable"}}}
//# sourceMappingURL=./Embed.map