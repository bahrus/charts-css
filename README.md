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
