# css-charts

The [charts.css](https://chartscss.org/) is an appealing, innovative way to display charts

```html
<css-charts>
    <table>
        <caption> Column Example #4 </caption>
        <thead>
        <tr>
            <th scope="col">Year</th>
            <th scope="col">Progress</th>
        </tr>
        </thead>
        <tbody>
            <tr itemscope>
                <th itemprop=key>2016</th>
                <td><data itemprop=value value=20></data></td>
            </tr>
            <tr itemscope>
                <th itemprop=key>2017</th>
                <td><data itemprop=value value=40></data></td>
            </tr>
            <tr itemscope>
                <th itemprop=key>2018</th>
                <td><data itemprop=value value=60></data></td>
            </tr>
            <tr itemscope>
                <th itemprop=key>2019</th>
                <td><data itemprop=value value=80></data></td>
            </tr>
            <tr itemscope>
                <th itemprop=key>2020</th>
                <td><data itemprop=value value=100></data></td>
            </tr>
        </tbody>
    </table>
</css-charts>
```

## Tech stack

`css-charts` is built HTML‑first on [`el-maker`](https://github.com/bahrus/el-maker)
(`ElementMaker` base + `roundabout` / `templateMaker` features) with
[`assign-gingerly`](https://github.com/bahrus/assign-gingerly) for declarative
DOM wiring. The shadow DOM template lives in [`root.html`](./root.html) and the
feature configuration in [`el-maker.json`](./el-maker.json) (generated from
[`el-maker.mjs`](./el-maker.mjs) via `npm run build-el-maker`). The previous
`trans-render` implementation is preserved under [`legacy/`](./legacy/). See
[`Chats/Conversion.md`](./Chats/Conversion.md) for conversion notes and open gaps.

## Viewing Demos Locally

1. Install git
2. Fork/clone this repo
3. Install node.js
4. Open command window to folder where you cloned this repo
5. > git submodule update --init --recursive
6. > npm install
7. > npm run serve
8. Open http://localhost:8000/demo/dev.html in a modern browser (Chrome 146+)

