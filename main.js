// ==UserScript==
// @name         看过动画自动标记音乐
// @namespace    http://tampermonkey.net/
// @version      1
// @description  看过动画自动标记音乐
// @author       astrack
// @match        *://chii.in/subject/*
// @match        *://bangumi.tv/subject/*
// @match        *://bgm.tv/subject/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict'

    document.addEventListener('click',(e) => {
        const target = $(e.target)
        const form = $('#collectBoxForm')

        // [1]
        if (
            target.hasClass('inputBtn') &&
            target.attr('type') === 'submit' &&
            target.attr('name') === 'update' &&
            $('#collect').is(':checked')
        ) {
            form.on('submit', () => false)
            e.preventDefault();

            // 防止重复点击
            target.disable()
            // 关联条目
            const relation = document.querySelector('.subject_section ul.browserCoverMedium')
            if (relation == null) return
            const list = relation.querySelectorAll('li')
            // [2] 获取gh
            const submitGh = form.attr('action').split('?gh=').pop()

            new Promise(async () => {
                for (let i = 0; i < list.length; i++) {
                    const title = list[i].querySelector('span').innerText
                    // 找到音乐的第一个元素
                    if (title !== '原声集' &&
                        title !== '片头曲' &&
                        title !== '片尾曲') {
                        continue
                    }
                    // 收藏这一类的所有
                    for (; i < list.length; i++) {
                        // 判断是否是新一类
                        if (list[i].classList.contains('sub')) break

                        const el = list[i]
                        const href = el.querySelector('a').href;
                        const subjectName = el.querySelector('.title').innerText;

                        // 收藏
                        await fetch(
                            `${href}/interest/update?gh=${submitGh}&ajax=1`,
                            {
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                },
                                method: 'POST',
                                body: 'referer=subject&interest=2&tags=&comment=&update=%E4%BF%9D%E5%AD%98',
                            },
                        ).then(() => console.log(`收藏 ${subjectName}`))
                    }
                }
                // [3] 提交原来的表单
                $.post(form.attr('action'), form.serialize()).done(() =>
                    location.reload()
                );
            }).then(()=>{})
        }
    })
})()

// [1] [2] [3] 引用自https://bgm.tv/dev/app/461