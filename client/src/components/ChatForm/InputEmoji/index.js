import React, { useState, useImperativeHandle, useEffect, useRef, forwardRef, useCallback } from 'react'
import {
    IconButton,
} from '@material-ui/core';
import SendIcon from '@material-ui/icons/Send';
import Picker from 'emoji-picker-react';
import t from 'prop-types'
import './styles.css'

function InputEmoji ({
    value,
    onChange,
    cleanOnEnter,
    onEnter,
    placeholder,
    onResize,
    onClick,
    onFocus,
    maxLength,
    keepOpenend,
    onKeyDown,
    inputClass,
    disableRecent,
    tabIndex,
    // style
    height,
    borderRadius,
    borderColor,
    fontSize,
    fontFamily,
    color,
    fontWeight,
}, ref) {
    const [showPicker, setShowPicker] = useState(false)
    const [allEmojiStyle] = useState({})
    const [currentSize, setCurrentSize] = useState(null)

    const textInputRef = useRef(null)
    const cleanedTextRef = useRef('')
    const placeholderRef = useRef(null);
    const [load, setLoad] = useState(false);

    const onSend = () => {
        // replaceAllTextEmojiToString()
        // console.log('send')
        const cleanedText = cleanedTextRef.current
        if (typeof onEnter === 'function') {
            onEnter(cleanedText)
        }
        
        if (cleanOnEnter) {
        updateHTML('')
        }
    }
 
    useImperativeHandle(ref, () => ({
        get value () {
        return cleanedTextRef.current
        },
        set value (value) {
        setValue(value)
        },
        focus: () => {
        textInputRef.current.focus()
        },
        blur: () => {
        replaceAllTextEmojiToString()
        }
    }))

    useEffect(() => {
        if (value && value.length > 0) {
        placeholderRef.current.style.opacity = 0
        } else {
        placeholderRef.current.style.opacity = 1
        }
    }, [value])

    useEffect(() => {
        if(showPicker) {
            setLoad(true);
        } 
        
    }, [showPicker])

    const replaceAllTextEmojis = useCallback((text) => {
        let allEmojis = getAllEmojisFromText(text)
        if (allEmojis) {
        allEmojis = [...new Set(allEmojis)] // remove duplicates

        allEmojis.forEach(emoji => {
            text = replaceAll(
            text,
            emoji,
            `<img data-emoji="${emoji}" src="https://cdn.jsdelivr.net/gh/iamcal/emoji-data@master/img-apple-64/png" />`
            )
        })
        }

        return text
    }, [allEmojiStyle])

    const updateHTML = useCallback((nextValue) => {
        nextValue = nextValue || value
        textInputRef.current.innerHTML = replaceAllTextEmojis(nextValue || '');
    }, [replaceAllTextEmojis])

    const checkAndEmitResize = useCallback(() => {
        const nextSize = {
        width: textInputRef.current.offsetWidth,
        height: textInputRef.current.offsetHeight
        }

        if (!currentSize ||
        currentSize.width !== nextSize.width ||
        currentSize.height !== nextSize.height) {
        onResize(nextSize)
        setCurrentSize(nextSize)
        }
    }, [currentSize, onResize])

    const emitChange = useCallback(() => {
        setTimeout(() => {
            replaceAllTextEmojiToString()
            if (typeof onChange === 'function') {
                onChange(cleanedTextRef.current);
                // console.log(cleanedTextRef.current)
            }

            if (typeof onResize === 'function') {
                checkAndEmitResize()
            }
        }, 0)
        
    }, [checkAndEmitResize, onChange, onResize])

    useEffect(() => {
        updateHTML()
    }, [updateHTML])

    const replaceAllTextEmojiToString = useCallback(() => {
        if (!textInputRef.current) {
            cleanedTextRef.current = ''
        }

        const container = document.createElement('div')
        container.innerHTML = textInputRef.current.innerHTML

        const images = Array.prototype.slice.call(container.querySelectorAll('img'))

        images.forEach(image => {
        image.outerHTML = image.dataset.emoji
        })

        let text = container.innerText
        text = text.replace(/\n/ig, '')

        cleanedTextRef.current = text
        // 

        checkPlaceholder()

    }, [emitChange])

    useEffect(() => {
        function handleKeydown (event) {
            const cleanedText = cleanedTextRef.current
            if(cleanedText)
                placeholderRef.current.style.opacity = 0
                
            if (typeof maxLength !== 'undefined' && event.keyCode !== 8 && totalCharacters() >= maxLength) {
                event.preventDefault()
            }

            if (event.keyCode === 13) {
                event.preventDefault()
                // console.log('enter')
                // replaceAllTextEmojiToString()
                if(cleanedText.trim() === ''){
                    return
                }
                if (typeof onEnter === 'function') {
                    onEnter(cleanedText)
                }
                
                if (cleanOnEnter) {
                updateHTML('')
                }
                
                if (typeof onKeyDown === 'function') {
                onKeyDown(event)
                }
                
                return false
            }

            if (typeof onKeyDown === 'function') {
                // console.log('keydown')
                onKeyDown(event)
            }
        }

        function handleKeyup(event) {
            // replaceAllTextEmojiToStringDebounced()
            replaceAllTextEmojiToString()
        }

        const inputEl = textInputRef.current

        inputEl.addEventListener('keydown', handleKeydown)
        inputEl.addEventListener('keyup', handleKeyup)

        return () => {
            inputEl.removeEventListener('keydown', handleKeydown)
            inputEl.removeEventListener('keyup', handleKeyup)
        }
    }, [onChange, cleanOnEnter, onEnter, updateHTML, replaceAllTextEmojiToString, replaceAllTextEmojiToString, emitChange, maxLength, onKeyDown])
    // }, [onChange, cleanOnEnter, onEnter, updateHTML, replaceAllTextEmojiToString, replaceAllTextEmojiToStringDebounced, emitChange, maxLength, onKeyDown])

    useEffect(() => {
        function handleFocus() {
            if (typeof onFocus === 'function') {
                onFocus()
            }
        }

        const inputEl = textInputRef.current

        inputEl.addEventListener('focus', handleFocus)

        return () => {
        inputEl.removeEventListener('focus', handleFocus)
        }
    }, [onFocus])

    function totalCharacters () {
        const text = textInputRef.current.innerText
        const html = textInputRef.current.innerHTML

        const textCount = text.length
        const emojisCount = (html.match(/<img/g) || []).length

        return textCount + emojisCount
    }

    useEffect(() => {
        if (textInputRef.current) {
        setCurrentSize({
            width: textInputRef.current.offsetWidth,
            height: textInputRef.current.offsetHeight
        })
        }
    }, [])


    function setValue (value) {
        updateHTML(value)
        textInputRef.current.blur()
    }

    function toggleShowPicker () {
        setShowPicker(showPicker => !showPicker)
    }

    function pasteHtmlAtCaret (html) {
        let sel, range
        if (window.getSelection) {
        // IE9 and non-IE
        sel = window.getSelection()
        if (sel.getRangeAt && sel.rangeCount) {
            range = sel.getRangeAt(0)
            range.deleteContents()

            // Range.createContextualFragment() would be useful here but is
            // non-standard and not supported in all browsers (IE9, for one)
            const el = document.createElement('div')
            el.innerHTML = html
            const frag = document.createDocumentFragment(); var node; var lastNode
            while ((node = el.firstChild)) {
            lastNode = frag.appendChild(node)
            }
            range.insertNode(frag)

            // Preserve the selection
            if (lastNode) {
            range = range.cloneRange()
            range.setStartAfter(lastNode)
            range.collapse(true)
            sel.removeAllRanges()
            sel.addRange(range)
            }
        }
        } else if (document.selection && document.selection.type !== 'Control') {
        // IE < 9
        document.selection.createRange().pasteHTML(html)
        }
    }

    function replaceAll (str, find, replace) {
        return str.replace(new RegExp(find, 'g'), replace)
    }

    function getImage (emoji) {
        return `<img data-emoji="${emoji.emoji}" src="https://cdn.jsdelivr.net/gh/iamcal/emoji-data@master/img-apple-64/${emoji.unified}.png" />`
    }

    function handleSelectEmoji (event, emojiObject) {
        placeholderRef.current.style.opacity = 0
        textInputRef.current.focus()
        pasteHtmlAtCaret(getImage(emojiObject))
        textInputRef.current.focus()
        
        emitChange()

        if (!keepOpenend) {
            toggleShowPicker()
        }
    }

    function getAllEmojisFromText (text) {
        return text.match(
        /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|\ud83c[\udffb-\udfff])?(?:\u200d(?:[^\ud800-\udfff]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|\ud83c[\udffb-\udfff])?)*/g
        )
    }

    function checkPlaceholder () {
        const text = cleanedTextRef.current

        if (text !== '' && placeholderRef.current.opacity !== 0) {
        placeholderRef.current.style.opacity = 0
        } else {
        placeholderRef.current.style.opacity = 1
        }
    }

    function handleClick () {
        if (typeof onClick === 'function') {
        onClick()
        }
    }

    return (
        <div className='react-emoji'>
        <div
            className='react-emoji-picker--container'
        >
            <div className={
            `react-emoji-picker--wrapper${
                showPicker ? ' react-emoji-picker--wrapper__show' : ''
            }`
            }>
            <div
                className={
                `react-emoji-picker${
                    showPicker ? ' react-emoji-picker__show' : ''
                }`
                }
            >{
                showPicker && <Picker onEmojiClick={handleSelectEmoji} preload={true} />
            }
            </div>
            </div>
        </div>
        <button
            className={
            `react-input-emoji--button${
                showPicker ? ' react-input-emoji--button__show' : ''
            }`
            }
            onClick={toggleShowPicker}
            >
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'><path d='M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0m0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10' /><path d='M8 7a2 2 0 1 0-.001 3.999A2 2 0 0 0 8 7M16 7a2 2 0 1 0-.001 3.999A2 2 0 0 0 16 7M15.232 15c-.693 1.195-1.87 2-3.349 2-1.477 0-2.655-.805-3.347-2H15m3-2H6a6 6 0 1 0 12 0' /></svg>
        </button>
        <div
            className='react-input-emoji--container'
            style={{
            borderRadius,
            borderColor,
            fontSize,
            fontFamily,
            color,
            fontWeight
            }}
        >
            <div className='react-input-emoji--wrapper' onClick={handleClick}>
                <div
                    ref={placeholderRef}
                    className='react-input-emoji--placeholder'
                >
                    {placeholder}
                </div>
            <div
                ref={textInputRef}
                tabIndex={tabIndex}
                contentEditable
                className={`react-input-emoji--input${inputClass ? ` ${inputClass}` : ''}`}
                onBlur={emitChange}
                onInput={emitChange}
            />
            </div>
        </div>
        <IconButton aria-label="send"
            // className={classes.sendButton}
            variant="contained"
            disabled={value.trim()? false: true}
            onClick={onSend}
        >
            <SendIcon fontSize="default"/>
        </IconButton>
        {showPicker &&
        <div
            className='react-input-emoji--overlay'
            onClick={toggleShowPicker}
        />
        }
        </div>
    )
}

const InputEmojiWithRef = forwardRef(InputEmoji)

InputEmojiWithRef.propTypes = {
    value: t.string,
    onChange: t.func,
    cleanOnEnter: t.bool,
    onEnter: t.func,
    placeholder: t.string,
    onResize: t.func,
    onClick: t.func,
    onFocus: t.func,
    maxLength: t.number,
    keepOpenend: t.bool,
    onKeyDown: t.func,
    inputClass: t.string,
    disableRecent: t.bool,
    tabIndex: t.number,
    // style
    height: t.number,
    borderRadius: t.number,
    borderColor: t.string,
    fontSize: t.number,
    fontFamily: t.string,
    color: t.string,
    fontWeight: t.string,
}

InputEmojiWithRef.defaultProps = {
    height: 30,
    placeholder: 'Type a message',
    borderRadius: 21,
    borderColor: '#EAEAEA',
    fontSize: 15,
    fontFamily: 'sans-serif',
    tabIndex: 0,
    color: 'black',
    fontWeight: 400,
}

export default InputEmojiWithRef