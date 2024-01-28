// ==UserScript==
// @name         看过动画自动标记音乐
// @namespace    http://astrack.icu/
// @version      0.1.0
// @description  看过动画自动标记音乐
// @author       astrack
// @include      /^http(s)?://(bgm.tv|bangumi.tv|chii.in)/subject/\d+$/
// @grant        none
// @license      MIT
// ==/UserScript==

'use strict';

function isMusic(e) {
    const title = e.querySelector('span').innerText;
    return title === '原声集' ||
        title === '片头曲' ||
        title === '片尾曲' ||
        title === '插入歌';
}

document.addEventListener('click', (e) => {
    const target = $(e.target);
    const form = $('#collectBoxForm');

    if (
        target.hasClass('inputBtn') &&
        target.attr('type') === 'submit' &&
        target.attr('name') === 'update' &&
        $('#collect').is(':checked')
    ) {
        form.on('submit', () => false);
        e.preventDefault();

        // 防止重复点击
        target.attr("disabled", "disabled");
        target.attr('value','提交中...');

        // 关联条目
        const relation = document.querySelector('.subject_section ul.browserCoverMedium');
        if (relation == null) return;
        const list = relation.querySelectorAll('li');
        const submitGh = form.attr('action').split('?gh=').pop();

        new Promise(async () => {
            for (let i = 0; i < list.length; i++) {
                // 找到第一个元素
                if (!isMusic(list[i])) {
                    continue;
                }

                // 收藏
                do {
                    const el = list[i];
                    const href = el.querySelector('a').href;
                    const subjectName = el.querySelector('.title').innerText;

                    await fetch(
                        `${href}/interest/update?gh=${submitGh}&ajax=1`,
                        {
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                            },
                            method: 'POST',
                            body: 'referer=subject&interest=2&tags=&comment=&update=%E4%BF%9D%E5%AD%98',
                        },
                    ).then(() => console.log(`收藏 ${subjectName}`)).catch(e => console.log(e));
                    i++;
                } while (i < list.length && !list[i].classList.contains('sep'));
                // 将最后一次循环增加的索引向前挪1
                i--;
            }
            // 提交原来的表单
            $.post(form.attr('action'), form.serialize()).done(() =>
                location.reload()
            );
        }).then(() => {
        });
    }
});